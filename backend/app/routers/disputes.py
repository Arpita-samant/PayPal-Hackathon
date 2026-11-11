from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Dict, Any
from app.models.schemas import DisputeAction, FairnessReportResponse, CommitAuditItem
from app.database import in_memory_db
from app.routers.auth import verify_jwt_token

router = APIRouter(prefix="/disputes", tags=["Disputes & Consensus"])

@router.post("/action", response_model=FairnessReportResponse)
def handle_dispute_action(action: DisputeAction, user: dict = Depends(verify_jwt_token)):
    # Find member by github_username
    target_member = None
    for m in in_memory_db["team_members"].values():
        if m["github_username"].lower() == action.github_username.lower():
            target_member = m
            break

    if not target_member:
        raise HTTPException(status_code=404, detail=f"Member '{action.github_username}' not found.")

    team_id = target_member["team_id"]
    team = in_memory_db["teams"].get(team_id)
    report_dict = in_memory_db["fairness_reports"].get(team_id)

    if not report_dict:
        raise HTTPException(status_code=400, detail="Cannot perform dispute action before fairness audit is generated.")

    if report_dict.get("is_locked"):
        raise HTTPException(status_code=400, detail="Fairness split is locked after final payout.")

    now = datetime.now(timezone.utc)
    approval_history = team.get("approval_history", [])

    # 1. Action: Flag commit or split
    if action.action == "flag":
        target_member["approval_status"] = "flagged"
        target_member["flag_reason"] = action.reason or "Flagged distribution for dispute review."
        target_member["approval_timestamp"] = now
        team["status"] = "disputed"

        approval_history.append({
            "timestamp": now.isoformat(),
            "member_id": target_member["id"],
            "github_username": target_member["github_username"],
            "action": "flag",
            "reason": target_member["flag_reason"]
        })

    # 2. Action: Approve
    elif action.action == "approve":
        target_member["approval_status"] = "approved"
        target_member["flag_reason"] = None
        target_member["approval_timestamp"] = now

        approval_history.append({
            "timestamp": now.isoformat(),
            "member_id": target_member["id"],
            "github_username": target_member["github_username"],
            "action": "approve",
            "reason": "Approved proposed monetary split"
        })

    in_memory_db["team_members"][target_member["id"]] = target_member

    # Check for unanimous consensus across all ELIGIBLE members
    eligible_members = [
        m for m in in_memory_db["team_members"].values() 
        if m["team_id"] == team_id and m.get("is_eligible", True)
    ]
    total_eligible = len(eligible_members)
    approved_count = sum(1 for m in eligible_members if m["approval_status"] == "approved")
    consensus = (approved_count == total_eligible and total_eligible > 0)
    has_flags = any(m["approval_status"] == "flagged" for m in eligible_members)

    report_dict["consensus_reached"] = consensus
    report_dict["pending_approvals"] = total_eligible - approved_count
    report_dict["total_eligible_members"] = total_eligible

    if consensus:
        team["status"] = "approved"
    elif has_flags:
        team["status"] = "disputed"
    else:
        team["status"] = "review"

    team["approval_history"] = approval_history
    in_memory_db["fairness_reports"][team_id] = report_dict
    in_memory_db["teams"][team_id] = team

    return FairnessReportResponse(**report_dict)
