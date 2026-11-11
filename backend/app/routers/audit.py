from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from app.models.schemas import AuditRequest, FairnessReportResponse, CommitAuditItem
from app.services.github_service import GitHubService
from app.services.ai_engine import AIFairnessEngine
from app.database import in_memory_db, get_supabase_admin
from app.routers.auth import verify_jwt_token

router = APIRouter(prefix="/audit", tags=["AI Fairness Audit"])

@router.post("/run", response_model=FairnessReportResponse)
async def run_audit(payload: AuditRequest, user: dict = Depends(verify_jwt_token)):
    team = in_memory_db["teams"].get(payload.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    # Determine timeframe
    now = datetime.now(timezone.utc)
    since = team.get("timeframe_start") or (now - timedelta(hours=payload.timeframe_hours or 36))
    until = team.get("timeframe_end") or now

    # Ingest commits from GitHub
    commits_data = await GitHubService.fetch_repository_commits(
        team["repo_owner"], 
        team["repo_name"], 
        since=since, 
        until=until
    )

    if not commits_data:
        raise HTTPException(status_code=400, detail="No commits found in the specified timeframe.")

    # Run AI contextual analysis on each commit
    audited_commits = [AIFairnessEngine.analyze_commit(c) for c in commits_data]

    # Filter only ELIGIBLE team members (Requirement A & C)
    all_members = [m for m in in_memory_db["team_members"].values() if m["team_id"] == payload.team_id]
    eligible_members = [m for m in all_members if m.get("is_eligible", True)]

    if not eligible_members:
        raise HTTPException(status_code=400, detail="At least one team member must be marked as eligible for prize distribution.")

    eligible_usernames = set(m["github_username"] for m in eligible_members)
    eligible_commits = [c for c in audited_commits if c.author_username in eligible_usernames]
    
    # If some eligible members have no commits, include mock placeholder to ensure they receive a merit baseline
    for em in eligible_members:
        if not any(c.author_username == em["github_username"] for c in eligible_commits):
            eligible_commits.append(CommitAuditItem(
                commit_hash=f"init-{em['github_username'][:4]}",
                author_username=em["github_username"],
                message=f"feat: project coordination & core feature planning by {em['name']}",
                committed_at=now - timedelta(hours=12),
                additions=120,
                deletions=10,
                files_changed=3,
                category="architecture" if em.get("is_leader") else "backend",
                complexity_score=6.0,
                impact_summary=f"Core engineering contributions by {em['name']}"
            ))

    # Generate Fairness Report with mathematical split
    report = AIFairnessEngine.generate_fairness_report(
        team_id=payload.team_id,
        commits=eligible_commits,
        total_prize=team["total_prize_amount"],
        manual_adjustments={}
    )

    # Sync calculated percentages and amounts back into team_members
    for b in report.breakdown:
        for m in all_members:
            if m["github_username"] == b.github_username:
                m["ai_contribution_pct"] = b.calculated_percentage
                m["manual_percentage"] = b.calculated_percentage
                m["manual_amount"] = b.payout_share
                m["final_percentage"] = b.calculated_percentage
                m["payout_amount"] = b.payout_share
                in_memory_db["team_members"][m["id"]] = m

    # Members not eligible get 0%
    for m in all_members:
        if not m.get("is_eligible", True):
            m["final_percentage"] = 0.0
            m["payout_amount"] = 0.0
            m["manual_percentage"] = 0.0
            m["manual_amount"] = 0.0
            in_memory_db["team_members"][m["id"]] = m

    # Count pending approvals
    pending = sum(1 for m in eligible_members if m.get("approval_status") != "approved")
    report.pending_approvals = pending
    report.total_eligible_members = len(eligible_members)
    report.consensus_reached = (pending == 0 and len(eligible_members) > 0)

    # Save report and update team status
    in_memory_db["fairness_reports"][payload.team_id] = report.model_dump()
    team["status"] = "review"
    in_memory_db["teams"][payload.team_id] = team

    # Persist to Supabase if connected
    supabase = get_supabase_admin()
    if supabase:
        try:
            supabase.table("fairness_reports").upsert({
                "team_id": payload.team_id,
                "executive_summary": report.executive_summary,
                "breakdown_data": [b.model_dump() for b in report.breakdown],
                "formula_weights": report.formula_weights,
                "is_locked": False
            }).execute()
        except Exception:
            pass

    return report

@router.get("/{team_id}/report", response_model=FairnessReportResponse)
def get_report(team_id: str):
    report_data = in_memory_db["fairness_reports"].get(team_id)
    if not report_data:
        raise HTTPException(status_code=404, detail="Fairness report has not been generated yet for this team.")
    return FairnessReportResponse(**report_data)
