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
  Send,
  ArrowRight
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
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 border border-metallic-700 bg-metallic-900/90 shadow-glass space-y-5 sm:space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-metallic-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cream">
            Consensus & Dispute Room
          </h2>
          <p className="text-xs sm:text-sm text-metallic-400 mt-1 max-w-2xl">
            Every participating member must review and explicitly vote "Approve" before payment rails can be unlocked.
          </p>
        </div>

        {/* Approval Progress Badge */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <div
            className={`px-3.5 py-2 rounded-xl border flex items-center space-x-2 text-xs font-mono ${
              isUnanimous
                ? 'bg-signal-green/10 border-signal-green/40 text-signal-green'
                : flaggedMembers.length > 0
                ? 'bg-signal-red/10 border-signal-red/40 text-signal-red'
                : 'bg-metallic-950 border-metallic-700 text-cream'
            }`}
          >
            {isUnanimous ? (
              <>
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>UNANIMOUS (100%)</span>
              </>
            ) : flaggedMembers.length > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{flaggedMembers.length} ACTIVE DISPUTE</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-metallic-400 shrink-0" />
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
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                isApproved
                  ? 'bg-metallic-950/60 border-signal-green/30'
                  : isFlagged
                  ? 'bg-signal-red/10 border-signal-red/40'
                  : 'bg-metallic-950/40 border-metallic-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-metallic-850 border border-metallic-700 flex items-center justify-center font-mono font-bold text-xs text-cream uppercase shrink-0">
                    {member.github_username.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs sm:text-sm text-cream font-mono truncate">
                      {member.name}
                    </div>
                    <div className="text-xs text-metallic-400 font-mono truncate">
                      @{member.github_username}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base sm:text-lg font-bold font-mono text-sage">
                    {member.final_percentage}%
                  </div>
                  <div className="text-xs font-mono text-cream font-medium">
                    {currency} {member.payout_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="pt-2 border-t border-metallic-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    {!isApproved && (
                      <button
                        onClick={() => onApprove(member.github_username)}
                        className="px-3 py-1.5 rounded-lg bg-sage/20 border border-sage/40 text-sage hover:bg-sage/30 text-xs font-mono transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {!isFlagged && (
                      <button
                        onClick={() => setFlagUser(member.github_username)}
                        className="px-3 py-1.5 rounded-lg border border-metallic-800 hover:border-signal-red/40 text-metallic-400 hover:text-signal-red text-xs font-mono transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Dispute</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Dispute Reason Display */}
              {isFlagged && member.flag_reason && (
                <div className="p-2.5 rounded-lg bg-signal-red/10 border border-signal-red/20 text-xs font-mono text-signal-red flex items-start space-x-2">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{member.flag_reason}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Navigation Action */}
      <div className="pt-3 border-t border-metallic-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs font-mono text-metallic-400">
          {isUnanimous ? (
            <span className="text-signal-green font-bold">
              Unanimous consensus achieved! Proceed to configure payment credentials.
            </span>
          ) : (
            <span>
              All {eligibleMembers.length} participating members must vote "Approve" to unlock payout.
            </span>
          )}
        </div>

        <button
          onClick={onProceedToPaymentSetup}
          disabled={!isUnanimous}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
            isUnanimous
              ? 'bg-sage text-metallic-950 hover:bg-cream shadow-glow cursor-pointer'
              : 'bg-metallic-800 text-metallic-500 border border-metallic-700 cursor-not-allowed opacity-60'
          }`}
        >
          <span>PROCEED TO PAYMENT GATEWAYS</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dispute Modal */}
      {flagUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-metallic-950/85 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 w-full max-w-md border border-metallic-700 bg-metallic-900 shadow-glass space-y-4">
            <h3 className="font-mono font-bold text-cream text-base flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-signal-red" />
              <span>Raise Dispute for @{flagUser}</span>
            </h3>
            <p className="text-xs text-metallic-400 font-sans">
              Enter your reason for disputing this split allocation. This will pause disbursement until reconciled.
            </p>
            <textarea
              rows={3}
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="e.g. My contributions to the payment module were not accounted for in this revision."
              className="w-full p-3 rounded-xl bg-metallic-950 border border-metallic-800 text-cream text-xs font-sans focus:outline-none focus:border-signal-red"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setFlagUser(null)}
                className="px-3.5 py-2 rounded-xl text-metallic-400 hover:text-cream text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFlagSubmit}
                disabled={isSubmitting || !flagReason.trim()}
                className="px-4 py-2 rounded-xl bg-signal-red text-metallic-950 font-bold text-xs font-mono hover:bg-signal-red/80 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
