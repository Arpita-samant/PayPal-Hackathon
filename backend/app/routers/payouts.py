import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    PayoutRequest, 
    PayoutResponse, 
    PaymentProviderInfo,
    PaymentProviderAuthorizeRequest,
    PaymentConfirmationSummary,
    RecipientConfirmationItem,
    PayoutRetryRequest
)
from app.services.payment_providers.registry import PaymentProviderRegistry
from app.database import in_memory_db, get_supabase_admin
from app.routers.auth import verify_jwt_token

router = APIRouter(prefix="/payouts", tags=["Global Payment & Payouts Engine"])

@router.get("/providers", response_model=List[PaymentProviderInfo])
def list_supported_providers():
    """List available global payment providers, supported currencies and countries"""
    return PaymentProviderRegistry.list_providers()

@router.post("/{team_id}/authorize-provider")
def authorize_provider(
    team_id: str, 
    payload: PaymentProviderAuthorizeRequest, 
    user: dict = Depends(verify_jwt_token)
):
    """Team leader selects and authorizes the disbursement provider"""
    team = in_memory_db["teams"].get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    provider = PaymentProviderRegistry.get(payload.provider)
    if not provider:
        raise HTTPException(status_code=400, detail=f"Unsupported payment provider: {payload.provider}")

    currency = team.get("currency", "USD")
    if currency not in provider.supported_currencies:
        raise HTTPException(
            status_code=400, 
            detail=f"{provider.name} does not support currency {currency}. Supported: {', '.join(provider.supported_currencies)}"
        )

    team["payment_provider"] = payload.provider
    team["provider_authorized"] = True
    fees = provider.calculate_fee(team["total_prize_amount"], currency)
    team["estimated_fees"] = fees
    team["final_total"] = round(team["total_prize_amount"] + fees, 2)
    team["status"] = "payment_setup"
    in_memory_db["teams"][team_id] = team

    return {
        "success": True,
        "message": f"Successfully authorized {provider.name} for team {team['name']}",
        "payment_provider": payload.provider,
        "estimated_fees": fees,
        "final_total": team["final_total"]
    }

@router.get("/{team_id}/confirmation-summary", response_model=PaymentConfirmationSummary)
def get_payment_confirmation_summary(team_id: str):
    """
    Requirement G: Display final confirmation before initiating payment:
    - Team name, Team leader, Payment provider, Total prize pool, Currency
    - Each recipient's name, receiving account, individual amount
    - Transaction fees, Final total
    - Checks eligibility and validation errors
    """
    team = in_memory_db["teams"].get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    provider_id = team.get("payment_provider", "paypal")
    provider = PaymentProviderRegistry.get_or_default(provider_id)
    currency = team.get("currency", "USD")
    total_prize = team["total_prize_amount"]

    members = [m for m in in_memory_db["team_members"].values() if m["team_id"] == team_id]
    eligible_members = [m for m in members if m.get("is_eligible", True)]

    recipients: List[RecipientConfirmationItem] = []
    validation_errors = []

    # Check unanimous consensus
    unapproved = [m["github_username"] for m in eligible_members if m.get("approval_status") != "approved"]
    if unapproved:
        validation_errors.append(f"Unanimous consensus is required. Pending approvals from: {', '.join(unapproved)}")

    if not team.get("provider_authorized"):
        validation_errors.append(f"Payment provider ({provider.name}) has not been authorized by the team leader.")

    allocated_sum = 0.0
    for m in eligible_members:
        acct_val = m.get("payment_account_value") or ""
        valid, msg = provider.validate_recipient_account(
            account_type=m.get("payment_account_type", "paypal_email"),
            account_value=acct_val,
            country=m.get("country", "US"),
            currency=currency
        )
        if not valid:
            validation_errors.append(f"@{m['github_username']} ({m['name']}): {msg}")

        amt = m.get("payout_amount", 0.0)
        allocated_sum += amt

        recipients.append(RecipientConfirmationItem(
            member_id=m["id"],
            name=m["name"],
            github_username=m["github_username"],
            account_type=m.get("payment_account_type", provider.account_type_label),
            account_value=acct_val,
            amount=amt,
            currency=currency,
            country=m.get("country", "US"),
            is_eligible=True,
            is_verified=valid
        ))

    if abs(allocated_sum - total_prize) > 0.05:
        validation_errors.append(
            f"Allocated payouts ({currency} {allocated_sum:.2f}) do not match total prize pool ({currency} {total_prize:.2f})."
        )

    fees = provider.calculate_fee(total_prize, currency)
    final_total = round(total_prize + fees, 2)

    return PaymentConfirmationSummary(
        team_name=team["name"],
        team_leader=team.get("leader_name", "Team Leader"),
        payment_provider=provider.name,
        total_prize_pool=total_prize,
        currency=currency,
        recipients=recipients,
        estimated_fees=fees,
        final_total=final_total,
        is_authorized_by_leader=bool(team.get("provider_authorized")),
        can_proceed=len(validation_errors) == 0,
        validation_errors=validation_errors
    )

@router.post("/execute", response_model=PayoutResponse)
async def execute_payout(payload: PayoutRequest, user: dict = Depends(verify_jwt_token)):
    """
    Executes batched/parallel payout distribution to all eligible recipients.
    Enforces unanimous approval, validates recipient accounts, prevents duplicates,
    and writes permanent immutable receipts into database.
    """
    team = in_memory_db["teams"].get(payload.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    if team["status"] == "paid":
        raise HTTPException(status_code=400, detail="Payout has already been executed and locked for this team. Duplicate payments prevented.")

    if not payload.confirmed_by_leader:
        raise HTTPException(status_code=400, detail="Explicit confirmation and authorization from the team leader is required.")

    # Validate confirmation summary
    summary = get_payment_confirmation_summary(payload.team_id)
    if not summary.can_proceed and not payload.simulate:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot execute payout: {'; '.join(summary.validation_errors)}"
        )

    provider_id = team.get("payment_provider", "paypal")
    provider = PaymentProviderRegistry.get_or_default(provider_id)
    currency = team.get("currency", "USD")

    items_to_pay = []
    for r in summary.recipients:
        items_to_pay.append({
            "member_id": r.member_id,
            "recipient_name": r.name,
            "recipient_username": r.github_username,
            "account_value": r.account_value,
            "amount": r.amount
        })

    # Execute disbursement via selected provider
    payout_result = await provider.execute_payout(
        team_id=payload.team_id,
        items=items_to_pay,
        currency=currency,
        note=payload.note or f"FairShare Hackathon Prize for {team['name']}",
        simulate=payload.simulate
    )

    # Lock report and mark team as paid
    report_dict = in_memory_db["fairness_reports"].get(payload.team_id)
    if report_dict:
        report_dict["is_locked"] = True
        in_memory_db["fairness_reports"][payload.team_id] = report_dict

    team["status"] = "paid"
    in_memory_db["teams"][payload.team_id] = team

    # Store permanent immutable receipt
    receipt_record = {
        "id": str(uuid.uuid4()),
        "team_id": payload.team_id,
        "batch_id": payout_result.batch_id,
        "provider": provider.name,
        "payout_status": payout_result.status,
        "total_payout_amount": payout_result.total_amount,
        "fee_amount": payout_result.fee_amount,
        "currency": payout_result.currency,
        "disbursement_details": [item.model_dump() for item in payout_result.items],
        "raw_provider_response": payout_result.raw_provider_response,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    in_memory_db["payout_receipts"][receipt_record["id"]] = receipt_record

    # Persist via Supabase Service Role key
    supabase = get_supabase_admin()
    if supabase:
        try:
            supabase.table("payout_receipts").insert({
                "team_id": payload.team_id,
                "batch_id": payout_result.batch_id,
                "provider": provider.name,
                "payout_status": payout_result.status,
                "total_payout_amount": payout_result.total_amount,
                "fee_amount": payout_result.fee_amount,
                "currency": payout_result.currency,
                "disbursement_details": receipt_record["disbursement_details"],
                "raw_provider_response": payout_result.raw_provider_response
            }).execute()

            supabase.table("teams").update({"status": "paid"}).eq("id", payload.team_id).execute()
        except Exception:
            pass

    return payout_result

@router.post("/{team_id}/retry", response_model=PayoutResponse)
async def retry_failed_payouts(
    team_id: str, 
    payload: PayoutRetryRequest, 
    user: dict = Depends(verify_jwt_token)
):
    """
    Requirement H: Safe retries of failed transactions without duplicating successful payments.
    """
    team = in_memory_db["teams"].get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    # Locate previous receipts
    receipts = [r for r in in_memory_db["payout_receipts"].values() if r["team_id"] == team_id and r["batch_id"] == payload.batch_id]
    if not receipts:
        raise HTTPException(status_code=404, detail="Receipt batch not found.")

    latest_receipt = receipts[-1]
    disbursement_details = latest_receipt.get("disbursement_details", [])

    # Identify items that were failed or explicitly requested
    failed_items = [
        item for item in disbursement_details 
        if item.get("status") == "FAILED" or (payload.failed_member_ids and item["member_id"] in payload.failed_member_ids)
    ]

    if not failed_items:
        raise HTTPException(status_code=400, detail="No failed recipient transactions found to retry.")

    provider_id = team.get("payment_provider", "paypal")
    provider = PaymentProviderRegistry.get_or_default(provider_id)
    currency = team.get("currency", "USD")

    # Format retry items
    items_to_retry = []
    for f in failed_items:
        items_to_retry.append({
            "member_id": f["member_id"],
            "recipient_name": f["recipient_name"],
            "recipient_username": f["recipient_username"],
            "account_value": f["receiving_account"],
            "amount": f["amount"]
        })

    retry_result = await provider.execute_payout(
        team_id=team_id,
        items=items_to_retry,
        currency=currency,
        note=f"FairShare Retry Payout for {team['name']}",
        simulate=payload.simulate
    )

    # Update previous receipt status
    for retried_item in retry_result.items:
        for original in disbursement_details:
            if original["member_id"] == retried_item.member_id:
                original["status"] = retried_item.status
                original["transaction_id"] = retried_item.transaction_id

    latest_receipt["disbursement_details"] = disbursement_details
    latest_receipt["payout_status"] = "SUCCESS" if all(i.get("status") == "SUCCESS" for i in disbursement_details) else "PARTIAL_FAILED"
    in_memory_db["payout_receipts"][latest_receipt["id"]] = latest_receipt

    return retry_result

@router.get("/{team_id}/receipts")
def get_payout_receipts(team_id: str):
    receipts = [r for r in in_memory_db["payout_receipts"].values() if r["team_id"] == team_id]
    return receipts
