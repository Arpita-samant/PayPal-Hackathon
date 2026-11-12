from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

SUPPORTED_CURRENCIES = ["USD", "INR", "EUR", "GBP", "CAD", "AUD", "SGD", "JPY", "AED", "CHF"]
SUPPORTED_PROVIDERS = ["paypal", "upi_razorpay", "stripe_transfer", "wise"]

class UserProfile(BaseModel):
    id: str
    github_username: str
    email: Optional[str] = None
    paypal_email: Optional[str] = None
    avatar_url: Optional[str] = None

class MemberInvite(BaseModel):
    name: str = Field(..., description="Member full name")
    email: Optional[str] = Field(None, description="Member email address")
    github_username: str = Field(..., description="Member GitHub username")
    role: str = Field(default="Core Contributor", description="Member team role")
    country: str = Field(default="US", description="Member two-letter country code")
    is_eligible: bool = Field(default=True, description="Whether member participates in prize pool")

class MemberEligibilityUpdate(BaseModel):
    is_eligible: bool

class MemberPaymentAccountUpdate(BaseModel):
    payment_account_type: str = Field(..., description="paypal_email | upi_id | iban | wise_email")
    payment_account_value: str = Field(..., description="The receiving identifier e.g. email or UPI VPA")
    country: Optional[str] = "US"

class TeamMemberResponse(BaseModel):
    id: str
    team_id: str
    name: str
    email: Optional[str] = None
    github_username: str
    role: str
    is_leader: bool = False
    is_eligible: bool = True
    country: str = "US"
    payment_account_type: str = "paypal_email"
    payment_account_value: Optional[str] = None
    account_verified: bool = False
    ai_contribution_pct: float = 0.0
    manual_percentage: float = 0.0
    manual_amount: float = 0.0
    final_percentage: float = 0.0
    payout_amount: float = 0.0
    approval_status: str = "pending" # pending | approved | flagged
    flag_reason: Optional[str] = None
    approval_timestamp: Optional[datetime] = None

class TeamCreate(BaseModel):
    name: str = Field(..., description="Project / Team name")
    hackathon_name: Optional[str] = Field(None, description="Hackathon name")
    hackathon_duration: Optional[str] = Field(None, description="Hackathon duration e.g. 36 hours")
    leader_name: str = Field(default="Team Leader", description="Leader name")
    leader_email: Optional[str] = Field(None, description="Leader email")
    repo_url: str = Field(..., description="Full GitHub repository URL")
    total_prize_amount: float = Field(default=1000.0, ge=1.0, description="Prize pool amount")
    currency: str = Field(default="USD", description="Currency symbol: USD, INR, EUR, GBP, etc.")
    timeframe_start: Optional[datetime] = None
    timeframe_end: Optional[datetime] = None

class TeamUpdatePrize(BaseModel):
    total_prize_amount: float = Field(..., ge=1.0, description="Total prize pool")
    currency: str = Field(..., description="Supported currency code")

class CommitAuditItem(BaseModel):
    id: Optional[str] = None
    commit_hash: str
    author_username: str
    message: str
    committed_at: datetime
    additions: int
    deletions: int
    files_changed: int
    category: str # frontend | backend | architecture | devops | docs | boilerplate
    complexity_score: float # 1.0 to 10.0
    impact_summary: Optional[str] = None

class ContributorBreakdown(BaseModel):
    github_username: str
    name: str = "Contributor"
    role_distribution: Dict[str, float]
    total_commits: int
    lines_added: int
    lines_deleted: int
    avg_complexity: float
    high_impact_commit_count: int
    calculated_percentage: float
    payout_share: float
    is_eligible: bool = True
    score_details: Dict[str, float]

class FairnessReportResponse(BaseModel):
    team_id: str
    executive_summary: str
    formula_weights: Dict[str, float]
    breakdown: List[ContributorBreakdown]
    commits: List[CommitAuditItem]
    is_locked: bool
    consensus_reached: bool
    pending_approvals: int
    total_eligible_members: int

class ManualSplitItem(BaseModel):
    member_id: str
    percentage: Optional[float] = None
    amount: Optional[float] = None

class ManualSplitRequest(BaseModel):
    mode: Literal["percentage", "amount"]
    splits: List[ManualSplitItem]
    reason: Optional[str] = "Manual merit adjustment by team leader"

class RevisionLogItem(BaseModel):
    timestamp: datetime
    modified_by: str
    type: str # percentage | amount | ai_reset
    reason: str
    changes: List[Dict[str, Any]]

class ApprovalEvent(BaseModel):
    timestamp: datetime
    member_id: str
    github_username: str
    action: str # approve | flag | reset
    reason: Optional[str] = None

class PaymentProviderInfo(BaseModel):
    provider_id: str
    name: str
    supported_currencies: List[str]
    supported_countries: List[str]
    account_type_label: str
    placeholder: str
    supports_batching: bool
    description: str

class PaymentProviderAuthorizeRequest(BaseModel):
    provider: str
    account_reference: str # e.g. PayPal merchant email or Razorpay account ID
    auth_secret_or_key: Optional[str] = None

class RecipientConfirmationItem(BaseModel):
    member_id: str
    name: str
    github_username: str
    account_type: str
    account_value: str
    amount: float
    currency: str
    country: str
    is_eligible: bool
    is_verified: bool

class PaymentConfirmationSummary(BaseModel):
    team_name: str
    team_leader: str
    payment_provider: str
    total_prize_pool: float
    currency: str
    recipients: List[RecipientConfirmationItem]
    estimated_fees: float
    final_total: float
    is_authorized_by_leader: bool
    can_proceed: bool
    validation_errors: List[str] = []

class PayoutItemReceipt(BaseModel):
    member_id: str
    recipient_name: str
    recipient_username: str
    account_type: str
    receiving_account: str
    amount: float
    currency: str
    transaction_id: str
    status: str # SUCCESS | PENDING | FAILED
    error_message: Optional[str] = None

class PayoutResponse(BaseModel):
    success: bool
    batch_id: str
    provider: str
    status: str # SUCCESS | PARTIAL_FAILED | FAILED
    total_amount: float
    fee_amount: float
    final_total: float
    currency: str
    timestamp: datetime
    items: List[PayoutItemReceipt]
    raw_provider_response: Optional[Dict[str, Any]] = None

class PayoutRetryRequest(BaseModel):
    batch_id: str
    failed_member_ids: Optional[List[str]] = None
    simulate: bool = False

class TeamResponse(BaseModel):
    id: str
    name: str
    hackathon_name: Optional[str] = None
    hackathon_duration: Optional[str] = None
    leader_name: str
    leader_email: Optional[str] = None
    repo_url: str
    repo_owner: str
    repo_name: str
    timeframe_start: Optional[datetime] = None
    timeframe_end: Optional[datetime] = None
    total_prize_amount: float
    currency: str
    status: str # draft | members_setup | auditing | review | disputed | approved | payment_setup | paid
    payment_provider: str
    provider_authorized: bool = False
    estimated_fees: float = 0.0
    final_total: float = 1000.0
    created_at: datetime
    members: List[TeamMemberResponse] = []
    fairness_report: Optional[FairnessReportResponse] = None
    distribution_history: List[RevisionLogItem] = []
    approval_history: List[ApprovalEvent] = []

class AuditRequest(BaseModel):
    team_id: str
    recalculate: bool = False
    timeframe_hours: Optional[int] = 36

class DisputeAction(BaseModel):
    github_username: str
    action: Literal["approve", "flag"]
    reason: Optional[str] = None
    target_commit_hash: Optional[str] = None

class PayoutRequest(BaseModel):
    team_id: str
    simulate: bool = False
    note: Optional[str] = "FairShare Hackathon Prize Distribution"
    confirmed_by_leader: bool = True
