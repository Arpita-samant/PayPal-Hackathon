export type SupportedCurrency = 'USD' | 'INR' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'SGD' | 'JPY' | 'AED' | 'CHF';
export type SupportedPaymentProvider = 'paypal' | 'upi_razorpay' | 'stripe_transfer' | 'wise';

export interface InitialMemberInput {
  name: string;
  github_username: string;
  role?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  name: string;
  email?: string;
  github_username: string;
  role: string;
  is_leader: boolean;
  is_eligible: boolean;
  country: string;
  payment_account_type: string;
  payment_account_value?: string;
  paypal_email?: string;
  account_verified: boolean;
  ai_contribution_pct: number;
  manual_percentage: number;
  manual_amount: number;
  final_percentage: number;
  payout_amount: number;
  approval_status: 'pending' | 'approved' | 'flagged';
  flag_reason?: string;
  approval_timestamp?: string;
}

export interface CommitAuditItem {
  id?: string;
  commit_hash: string;
  author_username: string;
  message: string;
  committed_at: string;
  additions: number;
  deletions: number;
  files_changed: number;
  category: 'frontend' | 'backend' | 'architecture' | 'devops' | 'docs' | 'boilerplate';
  complexity_score: number;
  impact_summary?: string;
}

export interface ContributorBreakdown {
  github_username: string;
  name: string;
  role_distribution: Record<string, number>;
  total_commits: number;
  lines_added: number;
  lines_deleted: number;
  avg_complexity: number;
  high_impact_commit_count: number;
  calculated_percentage: number;
  payout_share: number;
  is_eligible: boolean;
  score_details: {
    complexity_rating: number;
    impact_factor: number;
    code_volume_score: number;
  };
}

export interface FairnessReport {
  team_id: string;
  executive_summary: string;
  formula_weights: Record<string, number>;
  breakdown: ContributorBreakdown[];
  commits: CommitAuditItem[];
  is_locked: boolean;
  consensus_reached: boolean;
  pending_approvals: number;
  total_eligible_members: number;
}

export interface RevisionLogItem {
  timestamp: string;
  modified_by: string;
  type: string;
  reason: string;
  changes: Array<{
    member_id: string;
    username: string;
    old_pct: number;
    new_pct: number;
    old_amount: number;
    new_amount: number;
  }>;
}

export interface ApprovalEvent {
  timestamp: string;
  member_id: string;
  github_username: string;
  action: 'approve' | 'flag' | 'reset';
  reason?: string;
}

export interface Team {
  id: string;
  name: string;
  hackathon_name?: string;
  hackathon_duration?: string;
  leader_name: string;
  leader_email?: string;
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  timeframe_start?: string;
  timeframe_end?: string;
  total_prize_amount: number;
  currency: SupportedCurrency;
  status: 'draft' | 'members_setup' | 'auditing' | 'review' | 'disputed' | 'approved' | 'payment_setup' | 'paid';
  payment_provider: SupportedPaymentProvider;
  provider_authorized: boolean;
  estimated_fees: number;
  final_total: number;
  created_at: string;
  members: TeamMember[];
  fairness_report?: FairnessReport;
  distribution_history: RevisionLogItem[];
  approval_history: ApprovalEvent[];
}

export interface PaymentProviderInfo {
  provider_id: string;
  name: string;
  supported_currencies: string[];
  supported_countries: string[];
  account_type_label: string;
  placeholder: string;
  supports_batching: boolean;
  description: string;
}

export interface RecipientConfirmationItem {
  member_id: string;
  name: string;
  github_username: string;
  account_type: string;
  account_value: string;
  amount: number;
  currency: string;
  country: string;
  is_eligible: boolean;
  is_verified: boolean;
}

export interface PaymentConfirmationSummary {
  team_name: string;
  team_leader: string;
  payment_provider: string;
  total_prize_pool: number;
  currency: string;
  recipients: RecipientConfirmationItem[];
  estimated_fees: number;
  final_total: number;
  is_authorized_by_leader: boolean;
  can_proceed: boolean;
  validation_errors: string[];
}

export interface PayoutItemReceipt {
  member_id: string;
  recipient_name: string;
  recipient_username: string;
  account_type: string;
  receiving_account: string;
  paypal_email?: string;
  amount: number;
  currency: string;
  transaction_id: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  error_message?: string;
}

export interface PayoutResponse {
  success: boolean;
  batch_id: string;
  provider: string;
  status: string;
  total_amount: number;
  fee_amount: number;
  final_total: number;
  currency: string;
  timestamp: string;
  items: PayoutItemReceipt[];
  raw_provider_response?: any;
}
