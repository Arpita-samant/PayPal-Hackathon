import asyncio
import unittest
from app.services.github_service import GitHubService
from app.services.ai_engine import AIFairnessEngine
from app.services.payment_providers.registry import PaymentProviderRegistry
from app.models.schemas import (
    TeamCreate, 
    MemberInvite, 
    MemberEligibilityUpdate,
    MemberPaymentAccountUpdate,
    TeamUpdatePrize,
    ManualSplitRequest,
    ManualSplitItem,
    DisputeAction, 
    PaymentProviderAuthorizeRequest,
    PayoutRequest,
    AuditRequest
)
from app.routers import teams, audit, disputes, payouts
from app.database import in_memory_db

class TestFairShareMoneySplitting(unittest.TestCase):
    def test_01_github_url_parsing(self):
        owner, repo = GitHubService.parse_repo_url("https://github.com/facebook/react.git")
        self.assertEqual(owner, "facebook")
        self.assertEqual(repo, "react")

    def test_02_boilerplate_and_complexity_detection(self):
        lockfile_commit = {
            "commit_hash": "e5a12c8",
            "author_username": "elena-sec",
            "message": "chore(deps): bump packages and update package-lock.json",
            "committed_at": "2026-11-08T12:00:00Z",
            "additions": 1420,
            "deletions": 850,
            "files_changed": 2
        }
        item = AIFairnessEngine.analyze_commit(lockfile_commit)
        self.assertEqual(item.category, "boilerplate")
        self.assertLessEqual(item.complexity_score, 2.0)

    def test_03_providers_and_currencies(self):
        providers = PaymentProviderRegistry.list_providers()
        self.assertGreaterEqual(len(providers), 4)
        
        # Test UPI validation
        upi = PaymentProviderRegistry.get("upi_razorpay")
        valid, _ = upi.validate_recipient_account("upi_id", "arjun@okaxis", "IN", "INR")
        self.assertTrue(valid)
        invalid, _ = upi.validate_recipient_account("upi_id", "bad-format", "IN", "INR")
        self.assertFalse(invalid)

        # Test PayPal validation
        paypal = PaymentProviderRegistry.get("paypal")
        valid_pp, _ = paypal.validate_recipient_account("paypal_email", "dev@example.com", "US", "USD")
        self.assertTrue(valid_pp)

    def test_04_full_fairshare_lifecycle(self):
        async def run_flow():
            # A. Team Management & Prize Pool Entry (Currency: INR)
            team_res = await teams.create_team(
                TeamCreate(
                    name="Global AI Hackers",
                    leader_name="Arjun Sharma",
                    leader_email="arjun@hackathon.org",
                    repo_url="https://github.com/meta/hackathon-winner",
                    total_prize_amount=150000.00,
                    currency="INR"
                ),
                user={"sub": "leader-1"}
            )
            self.assertEqual(team_res.name, "Global AI Hackers")
            self.assertEqual(team_res.currency, "INR")
            self.assertEqual(team_res.total_prize_amount, 150000.00)

            # Invite new member
            invited = teams.invite_member(
                team_res.id,
                MemberInvite(
                    name="Priya Patel",
                    email="priya@hackathon.dev",
                    github_username="priya-ai",
                    role="ML Engineer",
                    country="IN",
                    is_eligible=True
                ),
                user={"sub": "leader-1"}
            )
            self.assertEqual(invited.name, "Priya Patel")

            # B. Toggle Member Eligibility (exclude 1 member from prize pool)
            members = teams.get_team(team_res.id).members
            non_eligible_member = next(m for m in members if not m.is_leader and m.github_username != "priya-ai")
            teams.toggle_eligibility(team_res.id, non_eligible_member.id, MemberEligibilityUpdate(is_eligible=False))
            updated_mem = next(m for m in teams.get_team(team_res.id).members if m.id == non_eligible_member.id)
            self.assertFalse(updated_mem.is_eligible)

            # C. Automatic Money Splitting (AI Contribution Analysis)
            report = await audit.run_audit(
                AuditRequest(team_id=team_res.id),
                user={"sub": "leader-1"}
            )
            self.assertGreater(len(report.breakdown), 0)
            
            # Ensure percentages sum to 100% and amounts sum to 150,000 INR
            sum_pct = sum(b.calculated_percentage for b in report.breakdown)
            sum_amt = sum(b.payout_share for b in report.breakdown)
            self.assertAlmostEqual(sum_pct, 100.0, places=1)
            self.assertAlmostEqual(sum_amt, 150000.00, places=1)

            # D. Manual Money Splitting (Percentage Mode)
            eligible = [m for m in teams.get_team(team_res.id).members if m.is_eligible]
            # Split evenly across eligible
            equal_pct = round(100.0 / len(eligible), 2)
            splits = [ManualSplitItem(member_id=m.id, percentage=equal_pct) for m in eligible]
            # Fix rounding
            diff = round(100.0 - sum(s.percentage for s in splits), 2)
            splits[0].percentage = round(splits[0].percentage + diff, 2)

            updated_team = teams.apply_manual_split(
                team_res.id,
                ManualSplitRequest(
                    mode="percentage",
                    splits=splits,
                    reason="Equalized share for late crunch contribution"
                ),
                user={"sub": "leader-1"}
            )
            self.assertEqual(len(updated_team.distribution_history), 1)

            # Test D2: Restore AI recommendation
            restored_team = teams.reset_to_ai_recommendation(team_res.id, user={"sub": "leader-1"})
            self.assertEqual(len(restored_team.distribution_history), 2)

            # E. Team Approval & Consensus (Unanimous approval required)
            for m in eligible:
                disputes.handle_dispute_action(
                    DisputeAction(github_username=m.github_username, action="approve"),
                    user={"sub": "user-1"}
                )
            
            approved_team = teams.get_team(team_res.id)
            self.assertEqual(approved_team.status, "approved")

            # F. Payment Account Connection (UPI / Razorpay for INR)
            teams.update_member_wallet(
                team_res.id,
                eligible[0].id,
                MemberPaymentAccountUpdate(
                    payment_account_type="upi_id",
                    payment_account_value="arjun@okhdfcbank",
                    country="IN"
                ) if hasattr(teams, 'update_member_wallet') else None
            )

            auth_res = payouts.authorize_provider(
                team_res.id,
                PaymentProviderAuthorizeRequest(
                    provider="upi_razorpay",
                    account_reference="rzp_live_merch_102938"
                ),
                user={"sub": "leader-1"}
            )
            self.assertTrue(auth_res["success"])

            # G. Final Payment Confirmation Summary
            summary = payouts.get_payment_confirmation_summary(team_res.id)
            self.assertEqual(summary.team_name, "Global AI Hackers")
            self.assertEqual(summary.payment_provider, "UPI / Direct Bank Transfer (India & Global)")
            self.assertEqual(summary.total_prize_pool, 150000.00)
            self.assertEqual(summary.currency, "INR")
            self.assertEqual(len(summary.recipients), len(eligible))

            # H. Transaction Management (Execute Batched Payout)
            payout_res = await payouts.execute_payout(
                PayoutRequest(
                    team_id=team_res.id,
                    simulate=True,
                    confirmed_by_leader=True,
                    note="FairShare Grand Prize"
                ),
                user={"sub": "leader-1"}
            )
            self.assertTrue(payout_res.success)
            self.assertEqual(payout_res.status, "SUCCESS")
            self.assertEqual(payout_res.total_amount, 150000.00)
            self.assertEqual(len(payout_res.items), len(eligible))

            # Verify receipts stored
            receipts = payouts.get_payout_receipts(team_res.id)
            self.assertEqual(len(receipts), 1)

        asyncio.run(run_flow())

if __name__ == "__main__":
    unittest.main()
