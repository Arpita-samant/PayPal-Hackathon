import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Send, 
  Lock, 
  RefreshCw,
  Building,
  UserCheck
} from 'lucide-react';
import { api } from '../lib/api';
import { PaymentConfirmationSummary, PayoutResponse } from '../types';

interface FinalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onPayoutSuccess: (res: PayoutResponse) => void;
}

export const FinalConfirmationModal: React.FC<FinalConfirmationModalProps> = ({
  isOpen,
  onClose,
  teamId,
  onPayoutSuccess,
}) => {
  const [summary, setSummary] = useState<PaymentConfirmationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulate, setSimulate] = useState(true);
  const [authorizedByLeader, setAuthorizedByLeader] = useState(false);
  const [note, setNote] = useState('');

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getConfirmationSummary(teamId);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate payment confirmation summary.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSummary();
      setAuthorizedByLeader(false);
    }
  }, [isOpen, teamId]);

  if (!isOpen) return null;

  const handleExecute = async () => {
    if (!summary || !authorizedByLeader) return;
    setIsExecuting(true);
    setError(null);
    try {
      const res = await api.executePayout({
        team_id: teamId,
        simulate,
        confirmed_by_leader: authorizedByLeader,
        note: note.trim() || `FairShare Disbursal for ${summary.team_name}`,
      });
      onPayoutSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Disbursement execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-metallic-950/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-metallic-700 bg-metallic-900/95 shadow-2xl p-4 sm:p-6 md:p-8 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-metallic-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sage/10 border border-sage/30 flex items-center justify-center text-sage shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-sage font-bold">
                Final Payout Authorization
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-cream">
                Disbursement Confirmation
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="p-1.5 sm:p-2 rounded-xl text-metallic-400 hover:text-metallic-200 hover:bg-metallic-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl border border-signal-red/30 bg-signal-red/10 text-signal-red text-xs font-mono flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-metallic-400 font-mono text-sm space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sage" />
            <p>Auditing team accounts and aggregating final payment summary...</p>
          </div>
        ) : summary ? (
          <div className="space-y-5">
            
            {/* Validation Errors banner */}
            {!summary.can_proceed && summary.validation_errors.length > 0 && (
              <div className="p-4 rounded-xl border border-signal-red/40 bg-signal-red/10 space-y-2">
                <div className="flex items-center space-x-2 text-signal-red font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Validation Blockers Must Be Resolved</span>
                </div>
                <ul className="list-disc list-inside text-xs font-mono text-signal-red/90 space-y-1">
                  {summary.validation_errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Overview Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl border border-metallic-800 bg-metallic-950/60">
                <div className="text-metallic-500 text-[10px] uppercase">Team</div>
                <div className="text-cream font-bold mt-0.5 truncate">{summary.team_name}</div>
              </div>

              <div className="p-3 rounded-xl border border-metallic-800 bg-metallic-950/60">
                <div className="text-metallic-500 text-[10px] uppercase">Leader</div>
                <div className="text-cream font-bold mt-0.5 flex items-center space-x-1 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-sage" />
                  <span className="truncate">{summary.team_leader}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-metallic-800 bg-metallic-950/60">
                <div className="text-metallic-500 text-[10px] uppercase">Gateway</div>
                <div className="text-sage font-bold mt-0.5 flex items-center space-x-1 truncate">
                  <Building className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{summary.payment_provider}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-metallic-800 bg-metallic-950/60">
                <div className="text-metallic-500 text-[10px] uppercase">Total Prize Pool</div>
                <div className="text-cream font-bold mt-0.5 text-xs sm:text-sm truncate">
                  {summary.currency} {summary.total_prize_pool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Recipient Roster */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-metallic-400">
                <span>RECIPIENTS ({summary.recipients.length})</span>
                <span>STATUS</span>
              </div>

              <div className="rounded-xl border border-metallic-800 overflow-hidden divide-y divide-metallic-850 bg-metallic-950/40 max-h-56 overflow-y-auto">
                {summary.recipients.map((rec) => (
                  <div key={rec.member_id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-cream font-bold truncate">{rec.name}</span>
                        <span className="text-metallic-500 text-[11px]">(@{rec.github_username})</span>
                      </div>
                      <div className="text-[11px] text-metallic-400 truncate">
                        {rec.account_value || <span className="text-signal-red">Missing Account Value</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                      <div className="text-right font-bold text-sage">
                        {rec.currency} {rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>

                      <div>
                        {rec.is_verified ? (
                          <span className="flex items-center space-x-1 text-signal-green text-[10px] px-2 py-0.5 rounded-full bg-signal-green/10 border border-signal-green/20">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>VERIFIED</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-signal-red text-[10px] px-2 py-0.5 rounded-full bg-signal-red/10 border border-signal-red/20">
                            <AlertTriangle className="w-3 h-3" />
                            <span>INVALID</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary & Fees */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-metallic-800 bg-metallic-950/70 font-mono text-xs space-y-2">
              <div className="flex justify-between text-metallic-400">
                <span>Subtotal (Prize Pool)</span>
                <span className="text-cream font-bold">
                  {summary.currency} {summary.total_prize_pool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-metallic-400">
                <span>Gateway Estimated Fee</span>
                <span className="text-metallic-300">
                  {summary.currency} {summary.estimated_fees.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-2 border-t border-metallic-850 flex justify-between items-center text-sm">
                <span className="font-bold text-cream">Final Required Total</span>
                <span className="font-bold text-sage text-base">
                  {summary.currency} {summary.final_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Note & Simulation Configuration */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono text-metallic-400 mb-1">
                  Memo / Statement (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={`Prize Distribution for ${summary.team_name}`}
                  className="w-full px-3 py-2 rounded-xl border border-metallic-800 bg-metallic-950 text-cream text-xs font-mono focus:border-sage focus:outline-none"
                />
              </div>

              {/* Sandbox Simulator Switch */}
              <div className="p-3.5 rounded-xl border border-metallic-800 bg-metallic-950/50 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-cream flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-sage" />
                    <span>Sandbox Simulation Mode</span>
                  </div>
                  <div className="text-[11px] text-metallic-400 font-mono">
                    Generates batch receipts and UTRs without debiting real bank funds.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={simulate}
                    onChange={(e) => setSimulate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-metallic-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                </label>
              </div>

              {/* Leader Mandatory Authorization Checkbox */}
              <div className="p-3.5 rounded-xl border border-sage/40 bg-sage/5 flex items-start space-x-3">
                <input
                  id="leader-auth-checkbox"
                  type="checkbox"
                  checked={authorizedByLeader}
                  onChange={(e) => setAuthorizedByLeader(e.target.checked)}
                  disabled={!summary.can_proceed && !simulate}
                  className="mt-0.5 w-4 h-4 rounded border-metallic-700 text-sage focus:ring-sage cursor-pointer"
                />
                <label htmlFor="leader-auth-checkbox" className="text-xs font-mono text-cream cursor-pointer select-none leading-relaxed">
                  <span className="font-bold text-sage">AUTHORIZATION:</span> I, <span className="underline font-bold">{summary.team_leader}</span>, authorize the payout disbursement of{' '}
                  <span className="font-bold text-cream">
                    {summary.currency} {summary.final_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>{' '}
                  to the {summary.recipients.length} recipients via {summary.payment_provider}.
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-metallic-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isExecuting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-metallic-700 text-metallic-400 hover:text-metallic-200 text-xs font-mono transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecute}
                disabled={!summary.can_proceed || !authorizedByLeader || isExecuting}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  summary.can_proceed && authorizedByLeader && !isExecuting
                    ? 'bg-sage text-metallic-950 hover:bg-cream shadow-glow cursor-pointer'
                    : 'bg-metallic-800 text-metallic-500 border border-metallic-700 cursor-not-allowed opacity-60'
                }`}
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Payout...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Execute {simulate ? 'Sandbox' : 'Live'} Payout</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};
