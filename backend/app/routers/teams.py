import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    TeamCreate, 
    TeamResponse, 
    TeamMemberResponse, 
    MemberInvite, 
    MemberEligibilityUpdate, 
    MemberPaymentAccountUpdate,
    TeamUpdatePrize,
    ManualSplitRequest,
    RevisionLogItem,
    ApprovalEvent,
    SUPPORTED_CURRENCIES
)
from app.services.github_service import GitHubService
from app.services.payment_providers.registry import PaymentProviderRegistry
from app.database import in_memory_db, get_supabase_admin
from app.routers.auth import verify_jwt_token

router = APIRouter(prefix="/teams", tags=["Teams & Members Management"])

def _rebalance_equal_eligible(team_id: str, total_prize: float):
    """Evenly balance eligible members if no AI report exists yet"""
    members = [m for m in in_memory_db["team_members"].values() if m["team_id"] == team_id]
    eligible = [m for m in members if m.get("is_eligible", True)]
    count = len(eligible)
    for m in members:
        if m.get("is_eligible", True) and count > 0:
            m["final_percentage"] = round(100.0 / count, 2)
            m["payout_amount"] = round(total_prize / count, 2)
            m["manual_percentage"] = m["final_percentage"]
            m["manual_amount"] = m["payout_amount"]
        else:
            m["final_percentage"] = 0.0
            m["payout_amount"] = 0.0
            m["manual_percentage"] = 0.0
            m["manual_amount"] = 0.0
        in_memory_db["team_members"][m["id"]] = m

@router.post("", response_model=TeamResponse)
async def create_team(payload: TeamCreate, user: dict = Depends(verify_jwt_token)):
    try:
        owner, repo = GitHubService.parse_repo_url(payload.repo_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    currency = payload.currency.upper()
    if currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Unsupported currency: {currency}. Supported: {', '.join(SUPPORTED_CURRENCIES)}")

    now = datetime.now(timezone.utc)
    timeframe_start = payload.timeframe_start or (now - timedelta(hours=36))
    timeframe_end = payload.timeframe_end or now
    team_id = str(uuid.uuid4())

    # Pre-fetch commits to seed initial team members
    commits = await GitHubService.fetch_repository_commits(owner, repo, timeframe_start, timeframe_end)
    unique_authors = list(set(c["author_username"] for c in commits))
    if not unique_authors:
        unique_authors = ["alex-dev", "sarah-ui", "dave-backend", "elena-sec"]

    members: List[TeamMemberResponse] = []
    
    # 1. Add Leader
    leader_id = str(uuid.uuid4())
    leader_member = TeamMemberResponse(
        id=leader_id,
        team_id=team_id,
        name=payload.leader_name or "Team Leader",
        email=payload.leader_email or "leader@example.com",
        github_username="leader-primary",
        role="Team Leader",
        is_leader=True,
        is_eligible=True,
        country="US",
        payment_account_type="paypal_email",
        payment_account_value=payload.leader_email or "leader@example.com",
        account_verified=True,
        ai_contribution_pct=0.0,
        manual_percentage=0.0,
        manual_amount=0.0,
        final_percentage=0.0,
        payout_amount=0.0,
        approval_status="approved", # Leader self-approves baseline
        approval_timestamp=now
    )
    members.append(leader_member)
    in_memory_db["team_members"][leader_id] = leader_member.model_dump()

    # 2. Add Contributors from Commits
    for idx, author in enumerate(unique_authors):
        member_id = str(uuid.uuid4())
        clean_name = author.lower().replace("-", " ").replace("_", " ").title()
        email_handle = author.lower().replace("-", "").replace("_", "")
        
        m = TeamMemberResponse(
            id=member_id,
            team_id=team_id,
            name=clean_name,
            email=f"{email_handle}@hackathon.dev",
            github_username=author,
            role="Core Contributor",
            is_leader=False,
            is_eligible=True,
            country="IN" if "sec" in author or "dev" in author else "US",
            payment_account_type="upi_id" if ("sec" in author or "dev" in author) else "paypal_email",
            payment_account_value=f"{email_handle}@okaxis" if ("sec" in author or "dev" in author) else f"{email_handle}.pay@example.com",
            account_verified=True,
            ai_contribution_pct=0.0,
            manual_percentage=0.0,
            manual_amount=0.0,
            final_percentage=0.0,
            payout_amount=0.0,
            approval_status="pending"
        )
        members.append(m)
        in_memory_db["team_members"][member_id] = m.model_dump()

    # Initial equal distribution among eligible members
    _rebalance_equal_eligible(team_id, payload.total_prize_amount)
    refreshed_members = [TeamMemberResponse(**in_memory_db["team_members"][m.id]) for m in members]

    # Default provider matching currency
    default_provider_id = "upi_razorpay" if currency == "INR" else "paypal"
    provider = PaymentProviderRegistry.get_or_default(default_provider_id)
    fees = provider.calculate_fee(payload.total_prize_amount, currency)

    team_data = {
        "id": team_id,
        "name": payload.name,
        "leader_name": payload.leader_name or "Team Leader",
        "leader_email": payload.leader_email,
        "repo_url": payload.repo_url,
        "repo_owner": owner,
        "repo_name": repo,
        "timeframe_start": timeframe_start,
        "timeframe_end": timeframe_end,
        "total_prize_amount": payload.total_prize_amount,
        "currency": currency,
        "status": "members_setup",
        "payment_provider": default_provider_id,
        "provider_authorized": False,
        "estimated_fees": fees,
        "final_total": round(payload.total_prize_amount + fees, 2),
        "created_at": now,
        "distribution_history": [],
        "approval_history": []
    }
    in_memory_db["teams"][team_id] = team_data

    # Save to Supabase if connected
    supabase = get_supabase_admin()
    if supabase:
        try:
            supabase.table("teams").insert({
                "id": team_id,
                "name": payload.name,
                "leader_name": payload.leader_name,
                "leader_email": payload.leader_email,
                "repo_url": payload.repo_url,
                "repo_owner": owner,
                "repo_name": repo,
                "total_prize_amount": payload.total_prize_amount,
                "currency": currency,
                "status": "members_setup",
                "payment_provider": "paypal"
            }).execute()
        except Exception:
            pass

    return TeamResponse(**team_data, members=refreshed_members)

@router.get("", response_model=List[TeamResponse])
def list_teams():
    teams_list = []
    for t in in_memory_db["teams"].values():
        team_dict = dict(t)
        team_dict.pop("members", None)
        team_dict.pop("fairness_report", None)
        members = [TeamMemberResponse(**m) for m in in_memory_db["team_members"].values() if m["team_id"] == t["id"]]
        fairness = in_memory_db["fairness_reports"].get(t["id"])
        teams_list.append(TeamResponse(
            **team_dict, 
            members=members, 
            fairness_report=fairness
        ))
    return teams_list

@router.get("/{team_id}", response_model=TeamResponse)
def get_team(team_id: str):
    team_data = in_memory_db["teams"].get(team_id)
    if not team_data:
        raise HTTPException(status_code=404, detail="Team not found.")
    team_dict = dict(team_data)
    team_dict.pop("members", None)
    team_dict.pop("fairness_report", None)
    members = [TeamMemberResponse(**m) for m in in_memory_db["team_members"].values() if m["team_id"] == team_id]
    fairness = in_memory_db["fairness_reports"].get(team_id)
    return TeamResponse(
        **team_dict, 
        members=members, 
        fairness_report=fairness
    )

@router.put("/{team_id}/prize", response_model=TeamResponse)
def update_prize_pool(team_id: str, payload: TeamUpdatePrize, user: dict = Depends(verify_jwt_token)):
    team = in_memory_db["teams"].get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if team["status"] == "paid":
        raise HTTPException(status_code=400, detail="Cannot alter prize pool of a finalized payout.")

    currency = payload.currency.upper()
    if currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Unsupported currency: {currency}")

    team["total_prize_amount"] = payload.total_prize_amount
    team["currency"] = currency

    # Re-calculate member amounts based on their current percentages
    members = [m for m in in_memory_db["team_members"].values() if m["team_id"] == team_id]
    for m in members:
        if m.get("is_eligible", True):
            m["payout_amount"] = round((m["final_percentage"] / 100.0) * payload.total_prize_amount, 2)
            m["manual_amount"] = m["payout_amount"]
        else:
            m["payout_amount"] = 0.0
            m["manual_amount"] = 0.0
        in_memory_db["team_members"][m["id"]] = m

    # Update fees
    provider = PaymentProviderRegistry.get_or_default(team.get("payment_provider", "paypal"))
    fees = provider.calculate_fee(payload.total_prize_amount, currency)
    team["estimated_fees"] = fees
    team["final_total"] = round(payload.total_prize_amount + fees, 2)

    in_memory_db["teams"][team_id] = team
    return get_team(team_id)

@router.post("/{team_id}/members/invite", response_model=TeamMemberResponse)
def invite_member(team_id: str, invite: MemberInvite, user: dict = Depends(verify_jwt_token)):
    team = in_memory_db["teams"].get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if team["status"] == "paid":
        raise HTTPException(status_code=400, detail="Cannot invite members after distribution is paid.")

    # Check for existing github_username
    for m in in_memory_db["team_members"].values():
        if m["team_id"] == team_id and m["github_username"].lower() == invite.github_username.lower():
            raise HTTPException(status_code=400, detail=f"Member @{invite.github_username} is already on the team.")

    member_id = str(uuid.uuid4())
    default_acct_type = "upi_id" if invite.country == "IN" else "paypal_email"
    default_acct_val = f"{invite.github_username}@okaxis" if invite.country == "IN" else (invite.email or f"{invite.github_username}@example.com")

    new_member = TeamMemberResponse(
        id=member_id,
        team_id=team_id,
        name=invite.name,
        email=invite.email,
        github_username=invite.github_username,
        role=invite.role,
        is_leader=False,
        is_eligible=invite.is_eligible,
        country=invite.country,
        payment_account_type=default_acct_type,
        payment_account_value=default_acct_val,
        account_verified=True,
        ai_contribution_pct=0.0,
        manual_percentage=0.0,
        manual_amount=0.0,
        final_percentage=0.0,
        payout_amount=0.0,
        approval_status="pending"
    )
    in_memory_db["team_members"][member_id] = new_member.model_dump()

    # Rebalance if no AI report
    if not in_memory_db["fairness_reports"].get(team_id):
        _rebalance_equal_eligible(team_id, team["total_prize_amount"])

    return TeamMemberResponse(**in_memory_db["team_members"][member_id])

@router.put("/{team_id}/members/{member_id}/eligibility", response_model=TeamMemberResponse)
def toggle_eligibility(team_id: str, member_id: str, payload: MemberEligibilityUpdate, user: dict = Depends(verify_jwt_token)):
    team = in_memory_db["teams"].get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if team["status"] == "paid":
        raise HTTPException(status_code=400, detail="Cannot change eligibility after distribution is finalized.")

    m = in_memory_db["team_members"].get(member_id)
    if not m or m["team_id"] != team_id:
        raise HTTPException(status_code=404, detail="Member not found.")

    m["is_eligible"] = payload.is_eligible
    if not payload.is_eligible:
        m["final_percentage"] = 0.0
        m["payout_amount"] = 0.0
        m["manual_percentage"] = 0.0
        m["manual_amount"] = 0.0
    in_memory_db["team_members"][member_id] = m

    # Reset approvals when eligibility changes
    for tm in in_memory_db["team_members"].values():
        if tm["team_id"] == team_id and not tm.get("is_leader"):
            tm["approval_status"] = "pending"
    team["status"] = "review"
    in_memory_db["teams"][team_id] = team

    return TeamMemberResponse(**m)

@router.delete("/{team_id}/members/{member_id}")
def remove_member(team_id: str, member_id: str, user: dict = Depends(verify_jwt_token)):
    team = in_memory_db["teams"].get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if team["status"] == "paid":
        raise HTTPException(status_code=400, detail="Cannot remove member after payout is locked.")

    m = in_memory_db["team_members"].get(member_id)
    if not m or m["team_id"] != team_id:
        raise HTTPException(status_code=404, detail="Member not found.")
    if m.get("is_leader"):
        raise HTTPException(status_code=400, detail="Team leader cannot be removed from team.")

    del in_memory_db["team_members"][member_id]
    return {"success": True, "message": f"Member {m['name']} removed from team."}

@router.put("/{team_id}/members/{member_id}/payment-account", response_model=TeamMemberResponse)
def update_payment_account(
    team_id: str, 
    member_id: str, 
    payload: MemberPaymentAccountUpdate, 
    user: dict = Depends(verify_jwt_token)
):
    team = in_memory_db["teams"].get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    m = in_memory_db["team_members"].get(member_id)
    if not m or m["team_id"] != team_id:
        raise HTTPException(status_code=404, detail="Member not found.")

    provider = PaymentProviderRegistry.get_or_default(team.get("payment_provider", "paypal"))
    valid, msg = provider.validate_recipient_account(
        account_type=payload.payment_account_type,
        account_value=payload.payment_account_value,
        country=payload.country or m.get("country", "US"),
        currency=team.get("currency", "USD")
    )
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    m["payment_account_type"] = payload.payment_account_type
    m["payment_account_value"] = payload.payment_account_value.strip()
    m["account_verified"] = True
    if payload.country:
        m["country"] = payload.country
    in_memory_db["team_members"][member_id] = m

    return TeamMemberResponse(**m)

# Backward-compatible alias
update_member_wallet = update_payment_account

@router.post("/{team_id}/split/manual", response_model=TeamResponse)
def apply_manual_split(team_id: str, payload: ManualSplitRequest, user: dict = Depends(verify_jwt_token)):
    team = in_memory_db["teams"].get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    if team["status"] == "paid":
        raise HTTPException(status_code=400, detail="Cannot adjust split after final payout has occurred.")

    total_prize = team["total_prize_amount"]
    members = [m for m in in_memory_db["team_members"].values() if m["team_id"] == team_id]
    eligible_members = [m for m in members if m.get("is_eligible", True)]

    # Map updates
    split_map = {s.member_id: s for s in payload.splits}
    changes_log = []

    if payload.mode == "percentage":
        total_submitted_pct = sum(s.percentage or 0.0 for s in payload.splits if s.member_id in [m["id"] for m in eligible_members])
        if round(total_submitted_pct, 1) != 100.0:
            raise HTTPException(
                status_code=400, 
                detail=f"Total percentages must equal exactly 100.0%. Current sum: {total_submitted_pct:.2f}%"
            )

        for m in eligible_members:
            if m["id"] in split_map:
                old_pct = m.get("final_percentage", 0.0)
                old_amt = m.get("payout_amount", 0.0)
                new_pct = round(split_map[m["id"]].percentage or 0.0, 2)
                new_amt = round((new_pct / 100.0) * total_prize, 2)
                
                m["manual_percentage"] = new_pct
                m["final_percentage"] = new_pct
                m["manual_amount"] = new_amt
                m["payout_amount"] = new_amt
                in_memory_db["team_members"][m["id"]] = m

                changes_log.append({
                    "member_id": m["id"],
                    "username": m["github_username"],
                    "old_pct": old_pct,
                    "new_pct": new_pct,
                    "old_amount": old_amt,
                    "new_amount": new_amt
                })

    elif payload.mode == "amount":
        total_submitted_amt = sum(s.amount or 0.0 for s in payload.splits if s.member_id in [m["id"] for m in eligible_members])
        if abs(round(total_submitted_amt, 2) - round(total_prize, 2)) > 0.05:
            diff = total_prize - total_submitted_amt
            raise HTTPException(
                status_code=400, 
                detail=f"Total allocated amounts must equal {team['currency']} {total_prize:.2f}. Difference: {diff:+.2f}"
            )

        for m in eligible_members:
            if m["id"] in split_map:
                old_pct = m.get("final_percentage", 0.0)
                old_amt = m.get("payout_amount", 0.0)
                new_amt = round(split_map[m["id"]].amount or 0.0, 2)
                new_pct = round((new_amt / total_prize) * 100.0, 2)

                m["manual_amount"] = new_amt
                m["payout_amount"] = new_amt
                m["manual_percentage"] = new_pct
                m["final_percentage"] = new_pct
                in_memory_db["team_members"][m["id"]] = m

                changes_log.append({
                    "member_id": m["id"],
                    "username": m["github_username"],
                    "old_pct": old_pct,
                    "new_pct": new_pct,
                    "old_amount": old_amt,
                    "new_amount": new_amt
                })

    # Requirement D & E: If distribution changes after approval, reset all member approvals!
    now = datetime.now(timezone.utc)
    for m in members:
        if not m.get("is_leader"):
            m["approval_status"] = "pending"
            m["approval_timestamp"] = None
        in_memory_db["team_members"][m["id"]] = m

    team["status"] = "review"

    # Append to distribution revision history
    history = team.get("distribution_history", [])
    history.append({
        "timestamp": now.isoformat(),
        "modified_by": team.get("leader_name", "Leader"),
        "type": payload.mode,
        "reason": payload.reason or "Leader manual adjustment",
        "changes": changes_log
    })
    team["distribution_history"] = history
    in_memory_db["teams"][team_id] = team

    return get_team(team_id)

@router.post("/{team_id}/split/reset-ai", response_model=TeamResponse)
def reset_to_ai_recommendation(team_id: str, user: dict = Depends(verify_jwt_token)):
    team = in_memory_db["teams"].get(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    report = in_memory_db["fairness_reports"].get(team_id)
    if not report:
        raise HTTPException(status_code=400, detail="Cannot reset to AI recommendation before audit is generated.")

    total_prize = team["total_prize_amount"]
    members = [m for m in in_memory_db["team_members"].values() if m["team_id"] == team_id]

    changes_log = []
    for b in report["breakdown"]:
        member = next((m for m in members if m["github_username"] == b["github_username"]), None)
        if member and member.get("is_eligible", True):
            old_pct = member["final_percentage"]
            old_amt = member["payout_amount"]
            ai_pct = b["calculated_percentage"]
            ai_amt = b["payout_share"]

            member["manual_percentage"] = ai_pct
            member["final_percentage"] = ai_pct
            member["manual_amount"] = ai_amt
            member["payout_amount"] = ai_amt
            member["approval_status"] = "pending"
            in_memory_db["team_members"][member["id"]] = member

            changes_log.append({
                "member_id": member["id"],
                "username": member["github_username"],
                "old_pct": old_pct,
                "new_pct": ai_pct,
                "old_amount": old_amt,
                "new_amount": ai_amt
            })

    now = datetime.now(timezone.utc)
    history = team.get("distribution_history", [])
    history.append({
        "timestamp": now.isoformat(),
        "modified_by": team.get("leader_name", "Leader"),
        "type": "ai_reset",
        "reason": "Restored AI-recommended mathematical distribution",
        "changes": changes_log
    })
    team["distribution_history"] = history
    team["status"] = "review"
    in_memory_db["teams"][team_id] = team

    return get_team(team_id)
