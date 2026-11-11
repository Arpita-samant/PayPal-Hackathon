import React, { useState } from 'react';
import { Team, TeamMember } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  MessageSquare, 
  History,
  Lock,
  Send
} from 'lucide-react';

interface ApprovalRoomProps {
  team: Team;
  onApprove: (username: string) => Promise<void>;
  onFlag: (username: string, reason: string) => Promise<void>;
  onProceedToPaymentSetup: () => void;
}

export const ApprovalRoom: React.FC<ApprovalRoomProps> = ({
  team,
  onApprove,
  onFlag,
  onProceedToPaymentSetup,
}) => {
  const [flagUser, setFlagUser] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const eligibleMembers = team.members.filter((m) => m.is_eligible);
  const approvedMembers = eligibleMembers.filter((m) => m.approval_status === 'approved');
  const flaggedMembers = eligibleMembers.filter((m) => m.approval_status === 'flagged');
  
  const isUnanimous = eligibleMembers.length > 0 && approvedMembers.length === eligibleMembers.length;
  const currency = team.currency;

  const handleFlagSubmit = async () => {
    if (!flagUser) return;
    setIsSubmitting(true);
    try {
      await onFlag(flagUser, flagReason.trim() || 'Flagged for distribution dispute.');
      setFlagUser(null);
      setFlagReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-metallic-800 shadow-glass space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-metallic-800">
        <div>
          <div className="flex items-center space-x-2 text-sage text-xs font-mono uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sage" />
            <span>Section E // Team Approval & Unanimous Consensus</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cream">
            Consensus & Dispute Room
          </h2>
          <p className="text-xs sm:text-sm text-metallic-400 mt-1 max-w-2xl">
            Every participating member must review and explicitly vote "Approve" before payment rails can be unlocked. If any distribution changes, approvals reset.
          </p>
        </div>

        {/* Approval Progress Badge */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <div
            className={`px-4 py-2 rounded-xl border flex items-center space-x-2 text-xs font-mono ${
              isUnanimous
                ? 'bg-signal-green/10 border-signal-green/40 text-signal-green'
                : flaggedMembers.length > 0
                ? 'bg-signal-red/10 border-signal-red/40 text-signal-red'
                : 'bg-metallic-900 border-metallic-700 text-cream'
            }`}
          >
            {isUnanimous ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>UNANIMOUS CONSENSUS REACHED (100%)</span>
              </>
            ) : flaggedMembers.length > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>{flaggedMembers.length} ACTIVE DISPUTE(S)</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-metallic-400" />
                <span>
                  {approvedMembers.length} / {eligibleMembers.length} APPROVED
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eligibleMembers.map((member) => {
          const isApproved = member.approval_status === 'approved';
          const isFlagged = member.approval_status === 'flagged';

          return (
            <div
              key={member.id}
              className={`p-4 rounded-xl border transition-all ${
                isApproved
                  ? 'bg-metallic-900/60 border-signal-green/30'
                  : isFlagged
                  ? 'bg-signal-red/10 border-signal-red/40'
                  : 'bg-metallic-900/40 border-metallic-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-metallic-850 border border-metallic-700 flex items-center justify-center font-mono font-bold text-xs text-cream uppercase">
                    {member.github_username.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-cream font-mono">
                      {member.name}
                    </div>
                    <div className="text-xs text-metallic-400 font-mono">
                      @{member.github_username}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold font-mono text-sage">
                    {member.final_percentage}%
                  </div>
                  <div className="text-xs font-mono text-cream font-medium">
                    {currency} {member.payout_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="pt-2 border-t border-metallic-850 flex items-center justify-between">
                <div className="text-xs font-mono">
                  {isApproved ? (
                    <span className="text-signal-green flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>APPROVED</span>
                    </span>
                  ) : isFlagged ? (
                    <span className="text-signal-red flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>DISPUTED</span>
                    </span>
                  ) : (
                    <span className="text-metallic-500 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>AWAITING APPROVAL</span>
                    </span>
                  )}
                </div>

                {team.status !== 'paid' && (
                  <div className="flex items-center space-x-1.5">
                    {!isApproved && (
                      <button
                        onClick={() => onApprove(member.github_username)}
                        className="px-2.5 py-1 rounded-md bg-sage/20 border border-sage/40 text-sage hover:bg-sage/30 text-xs font-mono transition-colors flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Vote Approve</span>
                      </button>
                    )}

                    {!isFlagged && (
                      <button
                        onClick={() => setFlagUser(member.github_username)}
                        className="px-2.5 py-1 rounded-md border border-metallic-800 hover:border-signal-red/40 text-metallic-400 hover:text-signal-red text-xs font-mono transition-colors flex items-center space-x-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Dispute</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Flag reason note if flagged */}
              {isFlagged && member.flag_reason && (
                <div className="mt-2.5 p-2 rounded bg-signal-red/15 border border-signal-red/30 text-[11px] font-mono text-signal-red">
                  Dispute Reason: "{member.flag_reason}"
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Footer Navigation CTA */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-metallic-850">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs font-mono text-metallic-400 hover:text-cream flex items-center space-x-1.5 self-start"
        >
          <History className="w-3.5 h-3.5 text-sage" />
          <span>View Approval History Log ({team.approval_history?.length || 0})</span>
        </button>

        <button
          onClick={onProceedToPaymentSetup}
          disabled={!isUnanimous || team.status === 'paid'}
          className={`px-6 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
            isUnanimous
              ? 'bg-cream hover:bg-cream-dim text-metallic-950 shadow-glow-sage cursor-pointer'
              : 'bg-metallic-850 border border-metallic-700 text-metallic-500 cursor-not-allowed'
          }`}
        >
          {team.status === 'paid' ? (
            <span>PAYOUT SETTLED</span>
          ) : isUnanimous ? (
            <>
              <ShieldCheck className="w-4 h-4 text-metallic-950" />
              <span>CONSENSUS LOCKED // PROCEED TO PAYMENT AUTHORIZATION</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>LOCKED // AWAITING UNANIMOUS APPROVAL</span>
            </>
          )}
        </button>
      </div>

      {/* Approval History Log Drawer */}
      {showHistory && (
        <div className="p-4 rounded-xl bg-metallic-950/80 border border-metallic-800 space-y-2">
          <div className="text-xs font-mono font-bold text-cream flex items-center space-x-2">
            <History className="w-4 h-4 text-sage" />
            <span>Audit Log of Approval Events</span>
          </div>

          {(!team.approval_history || team.approval_history.length === 0) ? (
            <div className="text-xs font-mono text-metallic-500">No approval events logged yet.</div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {team.approval_history.map((evt, idx) => (
                <div key={idx} className="p-2 rounded bg-metallic-900 border border-metallic-850 text-xs font-mono flex justify-between">
                  <div>
                    <span className="text-cream font-semibold">@{evt.github_username}</span>{' '}
                    <span className={evt.action === 'approve' ? 'text-signal-green' : 'text-signal-red'}>
                      [{evt.action.toUpperCase()}]
                    </span>
                    {evt.reason && <span className="text-metallic-400"> - "{evt.reason}"</span>}
                  </div>
                  <div className="text-metallic-500 text-[10px] shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dispute Modal */}
      {flagUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-metallic-950/85 backdrop-blur-md">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-md border border-metallic-700 shadow-glass space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-metallic-800">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-signal-red" />
                <h3 className="font-mono font-bold text-cream text-base">Raise Dispute for @{flagUser}</h3>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-mono text-metallic-400">
                Raising a dispute prevents prize money disbursement until resolved by the team.
              </p>

              <div>
                <label className="block text-xs font-mono text-metallic-400 mb-1">
                  Dispute Rationale
                </label>
                <textarea
                  rows={3}
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="e.g. Disagree with code volume weighting; requested re-check of API tests."
                  className="w-full p-2.5 rounded-lg bg-metallic-900 border border-metallic-800 text-cream text-xs font-sans focus:outline-none focus:border-sage"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFlagUser(null)}
                  className="px-3 py-1.5 rounded-lg border border-metallic-800 text-metallic-400 hover:text-cream text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFlagSubmit}
                  className="px-4 py-1.5 rounded-lg bg-signal-red text-white hover:bg-signal-red/90 text-xs font-mono font-bold"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
