import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RepoSelector } from './components/RepoSelector';
import { PrizePoolBar } from './components/PrizePoolBar';
import { TeamManagement } from './components/TeamManagement';
import { FairnessReportView } from './components/FairnessReportView';
import { ManualSplitEditor } from './components/ManualSplitEditor';
import { ApprovalRoom } from './components/ApprovalRoom';
import { PaymentSetupModal } from './components/PaymentSetupModal';
import { FinalConfirmationModal } from './components/FinalConfirmationModal';
import { DisputeModal } from './components/DisputeModal';
import { ReceiptsTable } from './components/ReceiptsTable';
import { api } from './lib/api';
import { 
  Team, 
  FairnessReport, 
  PayoutResponse, 
  PaymentProviderInfo, 
  SupportedCurrency 
} from './types';
import { 
  AlertCircle, 
  Users, 
  Cpu, 
  Sliders, 
  ShieldCheck, 
  CreditCard, 
  Receipt,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock
} from 'lucide-react';

type ActiveTab = 'squad' | 'audit' | 'split' | 'approvals' | 'payments' | 'ledger';

export const App: React.FC = () => {
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [fairnessReport, setFairnessReport] = useState<FairnessReport | null>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [providers, setProviders] = useState<PaymentProviderInfo[]>([]);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('squad');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [disputeUser, setDisputeUser] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Initialize and load providers & existing teams
  useEffect(() => {
    async function loadInitial() {
      try {
        const provs = await api.listProviders().catch(() => []);
        setProviders(provs);

        const teams = await api.listTeams().catch(() => []);
        if (teams.length > 0) {
          const firstTeam = teams[0];
          setActiveTeam(firstTeam);
          if (firstTeam.fairness_report) {
            setFairnessReport(firstTeam.fairness_report);
          }
          const recs = await api.getReceipts(firstTeam.id).catch(() => []);
          setReceipts(recs);

          // Route initial tab based on team status
          if (firstTeam.status === 'paid' && recs.length > 0) {
            setActiveTab('ledger');
          } else if (firstTeam.status === 'approved' || firstTeam.status === 'payment_setup') {
            setActiveTab('payments');
          } else if (firstTeam.fairness_report) {
            setActiveTab('audit');
          }
        }
      } catch (e) {
        // Backend starting up
      }
    }
    loadInitial();
  }, []);

  const refreshTeam = async (teamId: string) => {
    try {
      const refreshed = await api.getTeam(teamId);
      setActiveTeam(refreshed);
      if (refreshed.fairness_report) {
        setFairnessReport(refreshed.fairness_report);
      }
      const recs = await api.getReceipts(teamId);
      setReceipts(recs);
    } catch (err: any) {
      console.error('Failed to refresh team:', err);
    }
  };

  // 1. Create Team & Connect Repository
  const handleCreateTeam = async (data: {
    name: string;
    repo_url: string;
    total_prize_amount: number;
    timeframe_hours: number;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const created = await api.createTeam({
        name: data.name,
        leader_name: 'Team Leader',
        leader_email: 'leader@hackathon.org',
        repo_url: data.repo_url,
        total_prize_amount: data.total_prize_amount,
        currency: 'USD',
      });
      setActiveTeam(created);
      setFairnessReport(null);
      setReceipts([]);
      setActiveTab('squad');
      setSuccessMessage(`Team "${created.name}" created. Invite your teammates and configure eligibility.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create team.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Update Prize Pool & Currency
  const handleUpdatePrize = async (amount: number, currency: SupportedCurrency) => {
    if (!activeTeam) return;
    try {
      const updated = await api.updatePrize(activeTeam.id, amount, currency);
      setActiveTeam(updated);
      setSuccessMessage(`Prize pool updated to ${currency} ${amount.toLocaleString()}.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update prize pool.');
    }
  };

  // 3. Team Member Actions
  const handleInviteMember = async (memberData: {
    name: string;
    email?: string;
    github_username: string;
    role?: string;
    country?: string;
    is_eligible?: boolean;
  }) => {
    if (!activeTeam) return;
    try {
      await api.inviteMember(activeTeam.id, memberData);
      await refreshTeam(activeTeam.id);
      setSuccessMessage(`Member @${memberData.github_username} added to squad.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to invite member.');
    }
  };

  const handleToggleEligibility = async (memberId: string, isEligible: boolean) => {
    if (!activeTeam) return;
    try {
      await api.toggleEligibility(activeTeam.id, memberId, isEligible);
      await refreshTeam(activeTeam.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update eligibility.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeTeam) return;
    try {
      await api.removeMember(activeTeam.id, memberId);
      await refreshTeam(activeTeam.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove member.');
    }
  };

  // 4. Run AI Fairness Engine Audit
  const handleStartAudit = async () => {
    if (!activeTeam) return;
    setIsAuditing(true);
    setErrorMessage(null);
    try {
      const report = await api.runAudit(activeTeam.id, 36);
      setFairnessReport(report);
      await refreshTeam(activeTeam.id);
      setActiveTab('audit');
      setSuccessMessage('AI Contribution Audit completed successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Audit execution failed.');
    } finally {
      setIsAuditing(false);
    }
  };

  // 5. Manual Money Splitting
  const handleApplyManualSplit = async (data: {
    mode: 'percentage' | 'amount';
    splits: Array<{ member_id: string; percentage?: number; amount?: number }>;
    reason?: string;
  }) => {
    if (!activeTeam) return;
    try {
      const updated = await api.applyManualSplit(activeTeam.id, data);
      setActiveTeam(updated);
      setSuccessMessage('Manual distribution override applied. Member approvals have been reset for review.');
      setActiveTab('approvals');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to apply manual split.');
    }
  };

  const handleResetToAi = async () => {
    if (!activeTeam) return;
    try {
      const updated = await api.resetToAiRecommendation(activeTeam.id);
      setActiveTeam(updated);
      setSuccessMessage('Restored algorithmic AI-recommended distribution.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to restore AI recommendation.');
    }
  };

  // 6. Approval Room Actions
  const handleApprove = async (username: string) => {
    if (!activeTeam) return;
    try {
      await api.disputeAction({ github_username: username, action: 'approve' });
      await refreshTeam(activeTeam.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Approval action failed.');
    }
  };

  const handleFlagDispute = async (username: string, reason: string) => {
    if (!activeTeam) return;
    try {
      await api.disputeAction({ github_username: username, action: 'flag', reason });
      await refreshTeam(activeTeam.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Flag action failed.');
    }
  };

  // 7. Payment Provider Setup
  const handleAuthorizeProvider = async (provider: string, accountRef: string) => {
    if (!activeTeam) return;
    try {
      await api.authorizeProvider(activeTeam.id, {
        provider,
        account_reference: accountRef,
      });
      await refreshTeam(activeTeam.id);
      setSuccessMessage(`Payment gateway ${provider} authorized successfully.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Provider authorization failed.');
    }
  };

  const handleUpdateRecipientAccount = async (
    memberId: string, 
    accountType: string, 
    accountValue: string, 
    country: string
  ) => {
    if (!activeTeam) return;
    try {
      await api.updatePaymentAccount(activeTeam.id, memberId, {
        payment_account_type: accountType,
        payment_account_value: accountValue,
        country,
      });
      await refreshTeam(activeTeam.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save recipient account details.');
    }
  };

  // 8. Payout Execution Success
  const handlePayoutSuccess = async (res: PayoutResponse) => {
    if (!activeTeam) return;
    await refreshTeam(activeTeam.id);
    setActiveTab('ledger');
    setSuccessMessage(`Batched payout successfully disbursed! Batch ID: ${res.batch_id}`);
  };

  // Calculations for Prize Pool Bar
  const eligible = activeTeam?.members.filter((m) => m.is_eligible) || [];
  const totalAllocatedAmount = eligible.reduce((acc, m) => acc + (m.payout_amount || 0), 0);
  const totalAllocatedPct = eligible.reduce((acc, m) => acc + (m.final_percentage || 0), 0);
  const unallocatedAmount = (activeTeam?.total_prize_amount || 0) - totalAllocatedAmount;
  const unallocatedPct = 100 - totalAllocatedPct;

  const isUnanimous = eligible.length > 0 && eligible.every((m) => m.approval_status === 'approved');

  return (
    <div className="min-h-screen bg-metallic-950 text-metallic-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        onNewProject={() => {
          setActiveTeam(null);
          setFairnessReport(null);
          setReceipts([]);
          setActiveTab('squad');
        }}
        activeTeamName={activeTeam?.name}
        paypalEnv={activeTeam?.payment_provider || 'sandbox'}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Flash Notifications */}
        {errorMessage && (
          <div className="p-4 rounded-2xl border border-signal-red/30 bg-signal-red/10 text-signal-red text-xs font-mono flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="font-bold uppercase text-[10px] ml-4 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl border border-signal-green/30 bg-signal-green/10 text-signal-green text-xs font-mono flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="font-bold uppercase text-[10px] ml-4 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Switching */}
        {!activeTeam ? (
          <RepoSelector onSubmit={handleCreateTeam} isLoading={isLoading} />
        ) : (
          <div className="space-y-6">
            
            {/* Requirement B: Persistent Prize Pool Header Bar */}
            <PrizePoolBar
              team={activeTeam}
              onUpdatePrize={handleUpdatePrize}
              unallocatedPct={unallocatedPct}
              unallocatedAmount={unallocatedAmount}
            />

            {/* Stepper / Tab Navigation */}
            <div className="flex items-center space-x-1 sm:space-x-2 border-b border-metallic-800 pb-3 overflow-x-auto text-xs font-mono">
              
              <button
                onClick={() => setActiveTab('squad')}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
                  activeTab === 'squad'
                    ? 'bg-sage text-metallic-950 font-bold shadow-glow'
                    : 'text-metallic-400 hover:text-cream hover:bg-metallic-900/50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>1. Squad ({eligible.length}/{activeTeam.members.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
                  activeTab === 'audit'
                    ? 'bg-sage text-metallic-950 font-bold shadow-glow'
                    : 'text-metallic-400 hover:text-cream hover:bg-metallic-900/50'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>2. AI Audit</span>
                {fairnessReport && <span className="w-1.5 h-1.5 rounded-full bg-signal-green" />}
              </button>

              <button
                onClick={() => setActiveTab('split')}
                disabled={!fairnessReport}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
                  !fairnessReport ? 'opacity-40 cursor-not-allowed' :
                  activeTab === 'split'
                    ? 'bg-sage text-metallic-950 font-bold shadow-glow'
                    : 'text-metallic-400 hover:text-cream hover:bg-metallic-900/50'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>3. Split Tuning</span>
              </button>

              <button
                onClick={() => setActiveTab('approvals')}
                disabled={!fairnessReport}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
                  !fairnessReport ? 'opacity-40 cursor-not-allowed' :
                  activeTab === 'approvals'
                    ? 'bg-sage text-metallic-950 font-bold shadow-glow'
                    : 'text-metallic-400 hover:text-cream hover:bg-metallic-900/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>4. Consensus Room</span>
                {isUnanimous && <span className="w-1.5 h-1.5 rounded-full bg-signal-green" />}
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                disabled={!fairnessReport}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
                  !fairnessReport ? 'opacity-40 cursor-not-allowed' :
                  activeTab === 'payments'
                    ? 'bg-sage text-metallic-950 font-bold shadow-glow'
                    : 'text-metallic-400 hover:text-cream hover:bg-metallic-900/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>5. Payment Gateways</span>
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className={`px-3.5 py-2 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
                  activeTab === 'ledger'
                    ? 'bg-sage text-metallic-950 font-bold shadow-glow'
                    : 'text-metallic-400 hover:text-cream hover:bg-metallic-900/50'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>6. Ledger ({receipts.length})</span>
              </button>

            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'squad' && (
              <TeamManagement
                team={activeTeam}
                onInviteMember={handleInviteMember}
                onToggleEligibility={handleToggleEligibility}
                onRemoveMember={handleRemoveMember}
                onProceedToAudit={() => {
                  if (fairnessReport) {
                    setActiveTab('audit');
                  } else {
                    handleStartAudit();
                  }
                }}
                isAudited={Boolean(fairnessReport)}
              />
            )}

            {activeTab === 'audit' && (
              fairnessReport ? (
                <div className="space-y-6">
                  <FairnessReportView
                    report={fairnessReport}
                    members={activeTeam.members}
                    totalPrize={activeTeam.total_prize_amount}
                    currency={activeTeam.currency}
                    onOpenDispute={(username) => setDisputeUser(username)}
                    onApprove={handleApprove}
                    onProceedPayout={() => setActiveTab('split')}
                    isPaid={activeTeam.status === 'paid'}
                  />

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setActiveTab('split')}
                      className="px-6 py-3 rounded-xl bg-sage text-metallic-950 font-mono text-xs font-bold flex items-center space-x-2 hover:bg-cream transition-all shadow-glow"
                    >
                      <span>Proceed to Manual Split Tuning</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-3xl border border-metallic-700 bg-metallic-900/80 text-center space-y-4 max-w-2xl mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-sage/10 border border-sage/30 flex items-center justify-center text-sage mx-auto">
                    <Cpu className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-cream">AI Contribution Audit Pending</h3>
                  <p className="text-xs font-mono text-metallic-400">
                    The engine will analyze git commits across your repository ({activeTeam.repo_url}),
                    filter lockfiles and boilerplate, run AST cyclomatic complexity checks, and compute pgvector semantic impact embeddings.
                  </p>
                  <button
                    onClick={handleStartAudit}
                    disabled={isAuditing}
                    className="px-6 py-3 rounded-xl bg-sage text-metallic-950 font-mono text-xs font-bold inline-flex items-center space-x-2 hover:bg-cream transition-all shadow-glow cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isAuditing ? 'Auditing Git Tree...' : 'Execute AI Fairness Audit'}</span>
                  </button>
                </div>
              )
            )}

            {activeTab === 'split' && (
              <div className="space-y-6">
                <ManualSplitEditor
                  team={activeTeam}
                  onApplyManualSplit={handleApplyManualSplit}
                  onResetToAi={handleResetToAi}
                  isConsensusReached={isUnanimous}
                />

                <div className="flex justify-end space-x-4 max-w-5xl mx-auto">
                  <button
                    onClick={() => setActiveTab('approvals')}
                    disabled={Math.abs(unallocatedPct) > 0.05 || Math.abs(unallocatedAmount) > 0.1}
                    className={`px-6 py-3 rounded-xl font-mono text-xs font-bold flex items-center space-x-2 transition-all ${
                      Math.abs(unallocatedPct) <= 0.05 && Math.abs(unallocatedAmount) <= 0.1
                        ? 'bg-sage text-metallic-950 hover:bg-cream shadow-glow cursor-pointer'
                        : 'bg-metallic-800 text-metallic-500 border border-metallic-700 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>Proceed to Consensus Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'approvals' && (
              <div className="space-y-6">
                <ApprovalRoom
                  team={activeTeam}
                  onApprove={handleApprove}
                  onFlag={handleFlagDispute}
                  onProceedToPaymentSetup={() => setActiveTab('payments')}
                />
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <PaymentSetupModal
                  team={activeTeam}
                  providers={providers}
                  onAuthorizeProvider={handleAuthorizeProvider}
                  onUpdateRecipientAccount={handleUpdateRecipientAccount}
                  onProceedToConfirmation={() => setIsConfirmationOpen(true)}
                />
              </div>
            )}

            {activeTab === 'ledger' && (
              <ReceiptsTable
                receipts={receipts}
                currency={activeTeam.currency}
                teamId={activeTeam.id}
                onReceiptsUpdated={() => refreshTeam(activeTeam.id)}
              />
            )}

          </div>
        )}

      </main>

      {/* Final Confirmation Modal (Requirement G) */}
      {activeTeam && (
        <FinalConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          teamId={activeTeam.id}
          onPayoutSuccess={handlePayoutSuccess}
        />
      )}

      {/* Member Flag / Dispute Modal */}
      {disputeUser && activeTeam && (
        <DisputeModal
          isOpen={Boolean(disputeUser)}
          onClose={() => setDisputeUser(null)}
          username={disputeUser}
          onAction={async (data) => {
            if (data.action === 'flag' && data.reason) {
              await handleFlagDispute(data.github_username, data.reason);
            } else if (data.action === 'approve') {
              await handleApprove(data.github_username);
            }
            setDisputeUser(null);
          }}
          currentAdjustment={0}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-metallic-900 py-6 text-center text-xs font-mono text-metallic-600 mt-auto">
        <div>FAIRSHARE // SUPABASE & GLOBAL PAYOUTS ENGINE</div>
        <div className="text-[10px] text-metallic-700 mt-1">
          pgvector Semantic Embeddings • AST Cyclomatic Complexity • Multi-Provider Payouts (PayPal • Razorpay UPI • Stripe • Wise)
        </div>
      </footer>

    </div>
  );
};
