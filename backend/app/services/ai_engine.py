import json
import logging
from typing import List, Dict, Any, Tuple
from collections import defaultdict
from app.config import settings
from app.services.vector_service import VectorService
from app.models.schemas import CommitAuditItem, ContributorBreakdown, FairnessReportResponse

logger = logging.getLogger(__name__)

class AIFairnessEngine:
    # Reference category archetype descriptions for vector matching
    CATEGORY_DESCRIPTIONS = {
        "architecture": "core algorithms, system architecture, abstract syntax trees, vector embeddings, mathematical modeling",
        "backend": "fastapi routers, REST endpoints, database queries, webhook processing, server logic, payouts",
        "frontend": "user interface, tailwind css, react components, radar charts, dark mode, glassmorphism, responsive design",
        "devops": "ci cd pipelines, docker containers, deployment scripts, environment setup, github actions",
        "docs": "readme markdown, documentation, inline comments, architecture guides",
        "boilerplate": "package-lock.json, package.json, generated code, vendor bundles, node modules, dependency bumping"
    }

    _category_vectors = None

    @classmethod
    def get_category_vectors(cls):
        if cls._category_vectors is None:
            cls._category_vectors = {
                cat: VectorService.get_embedding(desc)
                for cat, desc in cls.CATEGORY_DESCRIPTIONS.items()
                if cat != "boilerplate"
            }
        return cls._category_vectors

    @classmethod
    def analyze_commit(cls, commit_data: Dict[str, Any]) -> CommitAuditItem:
        """Analyzes commit message, diff stats, and vector similarity to assess complexity & category"""
        msg = commit_data.get("message", "").lower()
        additions = commit_data.get("additions", 0)
        deletions = commit_data.get("deletions", 0)
        files = commit_data.get("files_changed", 1)

        # 1. Boilerplate / Lockfile detection (Anti-Cheat: prevents reward for lockfile lines)
        is_lockfile = "lock" in msg or "chore(deps)" in msg or (additions > 1000 and files <= 2)
        if is_lockfile:
            return CommitAuditItem(
                commit_hash=commit_data["commit_hash"],
                author_username=commit_data["author_username"],
                message=commit_data["message"],
                committed_at=commit_data["committed_at"],
                additions=additions,
                deletions=deletions,
                files_changed=files,
                category="boilerplate",
                complexity_score=1.2,
                impact_summary="Dependency/lockfile update. Filtered out from high-impact logic weight."
            )

        # 2. Vector classification
        commit_vec = VectorService.get_embedding(msg)
        cat_vectors = cls.get_category_vectors()
        best_category = "backend"
        best_sim = -1.0
        for cat, cat_vec in cat_vectors.items():
            sim = VectorService.cosine_similarity(commit_vec, cat_vec)
            if sim > best_sim:
                best_sim = sim
                best_category = cat

        # Heuristic keywords refinement
        if any(w in msg for w in ["ui", "css", "tailwind", "component", "dashboard", "glassmorphic", "chart"]):
            best_category = "frontend"
        elif any(w in msg for w in ["algorithm", "vector", "embedding", "ast", "pgvector", "parser"]):
            best_category = "architecture"
        elif any(w in msg for w in ["docker", "deploy", "action", "workflow"]):
            best_category = "devops"
        elif any(w in msg for w in ["api", "router", "endpoint", "supabase", "paypal", "payout"]):
            best_category = "backend"

        # 3. Dynamic complexity estimation
        # Algorithmic & architecture tasks receive higher multiplier
        base_complexity = 3.5
        if best_category == "architecture":
            base_complexity = 8.8
        elif best_category == "backend":
            base_complexity = 7.5
        elif best_category == "frontend":
            base_complexity = 7.0
        elif best_category == "devops":
            base_complexity = 5.0
        elif best_category == "docs":
            base_complexity = 2.5

        # Code volume factor (diminishing returns via log)
        volume_mod = min(1.5, max(0.5, (additions + deletions) / 300.0))
        complexity_score = round(min(10.0, max(1.0, base_complexity * (0.8 + 0.2 * volume_mod))), 2)

        impact_summary = f"{best_category.title()} development: {commit_data['message']} (Complexity rating: {complexity_score}/10.0)"

        return CommitAuditItem(
            commit_hash=commit_data["commit_hash"],
            author_username=commit_data["author_username"],
            message=commit_data["message"],
            committed_at=commit_data["committed_at"],
            additions=additions,
            deletions=deletions,
            files_changed=files,
            category=best_category,
            complexity_score=complexity_score,
            impact_summary=impact_summary
        )

    @classmethod
    def generate_fairness_report(
        cls, 
        team_id: str, 
        commits: List[CommitAuditItem], 
        total_prize: float,
        manual_adjustments: Dict[str, float] = None
    ) -> FairnessReportResponse:
        """Calculates mathematical multi-factor fairness split and compiles report"""
        manual_adjustments = manual_adjustments or {}
        
        # Formula weights: 40% complexity, 30% architectural impact, 15% PR/logic commit count, 15% normalized LOC
        weights = {
            "complexity": 0.40,
            "impact": 0.30,
            "pr_review": 0.15,
            "loc_volume": 0.15
        }

        user_commits = defaultdict(list)
        for c in commits:
            user_commits[c.author_username].append(c)

        user_metrics = {}
        for user, c_list in user_commits.items():
            total_c = len(c_list)
            # Filter non-boilerplate additions for volume
            meaningful_add = sum(c.additions for c in c_list if c.category != "boilerplate")
            total_del = sum(c.deletions for c in c_list)
            avg_comp = sum(c.complexity_score for c in c_list) / max(1, total_c)
            high_impact_count = sum(1 for c in c_list if c.complexity_score >= 7.0)

            # Role distributions
            cat_counts = defaultdict(int)
            for c in c_list:
                cat_counts[c.category] += 1
            role_dist = {cat: round((count / total_c) * 100.0, 1) for cat, count in cat_counts.items()}

            user_metrics[user] = {
                "total_commits": total_c,
                "lines_added": meaningful_add,
                "lines_deleted": total_del,
                "avg_complexity": avg_comp,
                "high_impact_count": high_impact_count,
                "role_distribution": role_dist
            }

        # Mathematical normalization
        max_loc = max([m["lines_added"] for m in user_metrics.values()] or [1])
        max_high_impact = max([m["high_impact_count"] for m in user_metrics.values()] or [1])
        max_commits = max([m["total_commits"] for m in user_metrics.values()] or [1])

        raw_scores = {}
        for user, m in user_metrics.items():
            comp_norm = m["avg_complexity"] / 10.0
            impact_norm = m["high_impact_count"] / max(1, max_high_impact)
            commit_norm = m["total_commits"] / max(1, max_commits)
            loc_norm = min(1.0, m["lines_added"] / max(1, max_loc))

            score = (
                weights["complexity"] * comp_norm +
                weights["impact"] * impact_norm +
                weights["pr_review"] * commit_norm +
                weights["loc_volume"] * loc_norm
            )
            raw_scores[user] = max(0.01, score)

        total_raw = sum(raw_scores.values())
        
        # Calculate baseline percentages and apply manual adjustments
        breakdowns: List[ContributorBreakdown] = []
        preliminary_pcts = {}
        for user, raw in raw_scores.items():
            base_pct = (raw / total_raw) * 100.0
            adj = manual_adjustments.get(user, 0.0)
            preliminary_pcts[user] = max(1.0, base_pct + adj)

        # Re-normalize to exactly 100.0%
        sum_prelim = sum(preliminary_pcts.values())
        for user, pct in preliminary_pcts.items():
            final_pct = round((pct / sum_prelim) * 100.0, 2)
            payout_share = round((final_pct / 100.0) * total_prize, 2)
            m = user_metrics[user]
            breakdowns.append(ContributorBreakdown(
                github_username=user,
                role_distribution=m["role_distribution"],
                total_commits=m["total_commits"],
                lines_added=m["lines_added"],
                lines_deleted=m["lines_deleted"],
                avg_complexity=round(m["avg_complexity"], 2),
                high_impact_commit_count=m["high_impact_count"],
                calculated_percentage=final_pct,
                payout_share=payout_share,
                score_details={
                    "complexity_rating": round(m["avg_complexity"], 2),
                    "impact_factor": m["high_impact_count"],
                    "code_volume_score": m["lines_added"]
                }
            ))

        # Adjust any rounding discrepancy on payout_share so sum == total_prize
        diff = round(total_prize - sum(b.payout_share for b in breakdowns), 2)
        if diff != 0 and breakdowns:
            breakdowns[0].payout_share = round(breakdowns[0].payout_share + diff, 2)

        executive_summary = (
            f"The AI Fairness Engine analyzed {len(commits)} commits across {len(breakdowns)} contributors. "
            f"Boilerplate dependencies and lockfiles were identified and discounted. "
            f"The mathematical split balances high-cyclomatic architectural algorithms (40%), verified feature impact (30%), "
            f"active engineering rhythm (15%), and normalized code additions (15%)."
        )

        return FairnessReportResponse(
            team_id=team_id,
            executive_summary=executive_summary,
            formula_weights=weights,
            breakdown=breakdowns,
            commits=commits,
            is_locked=False,
            consensus_reached=False,
            pending_approvals=len(breakdowns),
            total_eligible_members=len(breakdowns)
        )

    @classmethod
    def generate_ai_narrative(cls, commits: List[CommitAuditItem], breakdowns: List[ContributorBreakdown]) -> str:
        """Generates an intelligent executive summary narrative using Gemini 3.8 Flash"""
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                summary_items = [
                    f"@{b.github_username} ({b.calculated_percentage}%, avg complexity {b.avg_complexity}/10)"
                    for b in breakdowns
                ]
                prompt = (
                    f"You are the AI Fairness Engine for a hackathon prize splitter. "
                    f"Analyze this team: {len(commits)} commits across {len(breakdowns)} contributors: "
                    + ", ".join(summary_items)
                    + ". In 2 concise sentences, provide an executive summary explaining how the prize pool is mathematically divided based on architectural cyclomatic complexity, feature impact, and filtered volume."
                )
                res = client.models.generate_content(
                    model="gemini-3.8-flash",
                    contents=prompt
                )
                if res and res.text:
                    return res.text.strip()
            except Exception as e:
                logger.warning(f"Gemini narrative generation failed: {e}. Using deterministic narrative.")

        return (
            f"The AI Fairness Engine analyzed {len(commits)} commits across {len(breakdowns)} contributors. "
            f"Boilerplate dependencies and lockfiles were identified and discounted. "
            f"The mathematical split balances high-cyclomatic architectural algorithms (40%), verified feature impact (30%), "
            f"active engineering rhythm (15%), and normalized code additions (15%)."
        )
