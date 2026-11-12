import { 
  Team, 
  FairnessReport, 
  PayoutResponse, 
  TeamMember,
  PaymentProviderInfo,
  PaymentConfirmationSummary,
  SupportedCurrency
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // A. Team Management & Prize Pool
  createTeam: (data: { 
    name: string; 
    hackathon_name?: string;
    hackathon_duration?: string;
    leader_name?: string; 
    leader_github_username?: string;
    leader_email?: string; 
    repo_url: string; 
    total_prize_amount: number; 
    currency?: SupportedCurrency;
    initial_members?: Array<{ name: string; github_username: string; role?: string }>;
  }) =>
    request<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listTeams: () => request<Team[]>('/teams'),

  getTeam: (teamId: string) => request<Team>(`/teams/${teamId}`),

  updatePrize: (teamId: string, totalPrizeAmount: number, currency: SupportedCurrency) =>
    request<Team>(`/teams/${teamId}/prize`, {
      method: 'PUT',
      body: JSON.stringify({ total_prize_amount: totalPrizeAmount, currency }),
    }),

  inviteMember: (teamId: string, member: {
    name: string;
    email?: string;
    github_username: string;
    role?: string;
    country?: string;
    is_eligible?: boolean;
  }) =>
    request<TeamMember>(`/teams/${teamId}/members/invite`, {
      method: 'POST',
      body: JSON.stringify(member),
    }),

  toggleEligibility: (teamId: string, memberId: string, isEligible: boolean) =>
    request<TeamMember>(`/teams/${teamId}/members/${memberId}/eligibility`, {
      method: 'PUT',
      body: JSON.stringify({ is_eligible: isEligible }),
    }),

  removeMember: (teamId: string, memberId: string) =>
    request<{ success: boolean; message: string }>(`/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
    }),

  updatePaymentAccount: (teamId: string, memberId: string, data: {
    payment_account_type: string;
    payment_account_value: string;
    country?: string;
  }) =>
    request<TeamMember>(`/teams/${teamId}/members/${memberId}/payment-account`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // D. Manual Money Splitting (Percentage or Amount Mode)
  applyManualSplit: (teamId: string, data: {
    mode: 'percentage' | 'amount';
    splits: Array<{ member_id: string; percentage?: number; amount?: number }>;
    reason?: string;
  }) =>
    request<Team>(`/teams/${teamId}/split/manual`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetToAiRecommendation: (teamId: string) =>
    request<Team>(`/teams/${teamId}/split/reset-ai`, {
      method: 'POST',
    }),

  // C. AI Contribution Audit
  runAudit: (teamId: string, timeframeHours = 36) =>
    request<FairnessReport>('/audit/run', {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId, timeframe_hours: timeframeHours }),
    }),

  getReport: (teamId: string) => request<FairnessReport>(`/audit/${teamId}/report`),

  // E. Team Approval & Disputes
  disputeAction: (data: {
    github_username: string;
    action: 'approve' | 'flag';
    reason?: string;
  }) =>
    request<FairnessReport>('/disputes/action', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // F, G, H. Payment Providers & Confirmation
  listProviders: () => request<PaymentProviderInfo[]>('/payouts/providers'),

  authorizeProvider: (teamId: string, data: {
    provider: string;
    account_reference: string;
    auth_secret_or_key?: string;
  }) =>
    request<{ success: boolean; message: string; payment_provider: string; estimated_fees: number; final_total: number }>(
      `/payouts/${teamId}/authorize-provider`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  getConfirmationSummary: (teamId: string) =>
    request<PaymentConfirmationSummary>(`/payouts/${teamId}/confirmation-summary`),

  executePayout: (data: {
    team_id: string;
    simulate?: boolean;
    note?: string;
    confirmed_by_leader: boolean;
  }) =>
    request<PayoutResponse>('/payouts/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  retryPayout: (teamId: string, data: {
    batch_id: string;
    failed_member_ids?: string[];
    simulate?: boolean;
  }) =>
    request<PayoutResponse>(`/payouts/${teamId}/retry`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getReceipts: (teamId: string) => request<any[]>(`/payouts/${teamId}/receipts`),
};
