import React, { useState } from 'react';
import { FairnessReport, TeamMember, PayoutResponse } from '../types';
import { X, Send, CheckCircle2, ShieldAlert, Sparkles, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: FairnessReport;
  members: TeamMember[];
  totalPrize: number;
  currency: string;
  onExecutePayout: (simulate: boolean) => Promise<PayoutResponse>;
  isConsensusReached: boolean;
}

export const PayoutModal: React.FC<PayoutModalProps> = ({
  isOpen,
  onClose,
  report,
  members,
  totalPrize,
  currency,
  onExecutePayout,
  isConsensusReached,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [payoutResult, setPayoutResult] = useState<PayoutResponse | null>(null);
  const [simulateMode, setSimulateMode] = useState(!isConsensusReached);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setIsExecuting(true);
    setErrorMsg(null);
    try {
      const res = await onExecutePayout(simulateMode);
      setPayoutResult(res);
      // Trigger Nothing OS styled subtle confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F5F5ED', '#9AA889', '#BCBCC9'],
        });
      } catch (e) {
        // Safe fallback if confetti canvas fails
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payout execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-metallic-950/85 backdrop-blur-md">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 w-full max-w-xl border border-metallic-700 shadow-glass animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-metallic-800">
          <div>
            <div className="text-[10px] font-mono uppercase text-sage">PayPal Payouts v1 API</div>
            <h3 className="text-xl font-bold text-cream">
              Batched Prize Disbursement
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-metallic-400 hover:text-cream hover:bg-metallic-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Payout already executed */}
        {payoutResult ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-signal-green/20 border border-signal-green text-signal-green flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-cream font-mono">
                DISBURSEMENT COMPLETE
              </h4>
              <p className="text-xs text-metallic-400 font-mono mt-1">
                Batch ID: <span className="text-sage">{payoutResult.batch_id}</span>
              </p>
              <p className="text-xs text-metallic-400 font-mono">
                Total Disbursed: <span className="text-cream font-bold">{payoutResult.currency} {payoutResult.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-metallic-900 border border-metallic-800 text-left font-mono text-[11px] text-metallic-400 max-h-40 overflow-y-auto">
              <div className="text-metallic-500 uppercase pb-1 mb-1 border-b border-metallic-800">Transaction Receipts:</div>
              {payoutResult.items.map((item) => (
                <div key={item.transaction_id} className="flex justify-between py-1">
                  <span>@{item.recipient_username} ({item.paypal_email})</span>
                  <span className="text-cream">{item.currency} {item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg bg-cream text-metallic-950 font-mono text-xs font-bold uppercase transition-all"
            >
              DONE & VIEW AUDIT RECEIPTS
            </button>
          </div>
        ) : (
          <div className="space-y-5 my-4">
            
            {/* Warning if consensus not reached */}
            {!isConsensusReached && (
              <div className="p-3 rounded-xl border border-signal-orange/30 bg-signal-orange/10 text-signal-orange text-xs font-mono flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Team consensus is still pending.</div>
                  <div className="text-[11px] opacity-90">
                    You can execute in Sandbox Simulation mode to verify batch routing without waiting for all member approvals.
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl border border-signal-red/30 bg-signal-red/10 text-signal-red text-xs font-mono">
                {errorMsg}
              </div>
            )}

            {/* Disbursement Summary List */}
            <div className="p-3 rounded-xl bg-metallic-900/60 border border-metallic-800 space-y-2">
              <div className="flex justify-between text-[11px] font-mono text-metallic-500 pb-1 border-b border-metallic-800">
                <span>RECIPIENT & PAYPAL WALLET</span>
                <span>SPLIT & AMOUNT</span>
              </div>
              {report.breakdown.map((item) => {
                const member = members.find((m) => m.github_username === item.github_username);
                return (
                  <div key={item.github_username} className="flex justify-between text-xs font-mono">
                    <div>
                      <span className="text-cream font-medium">@{item.github_username}</span>
                      <span className="text-metallic-500 text-[10px] ml-1.5 truncate">
                        ({member?.paypal_email || 'missing wallet'})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sage mr-2">{item.calculated_percentage}%</span>
                      <span className="text-cream font-bold">
                        {currency} {item.payout_share.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sandbox Simulation Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-metallic-800 bg-metallic-900/40 text-xs font-mono">
              <div>
                <div className="text-cream font-medium">Sandbox / Simulation Mode</div>
                <div className="text-[10px] text-metallic-500">
                  Execute safe dry-run with simulated PayPal transaction receipts
                </div>
              </div>
              <input
                type="checkbox"
                checked={simulateMode}
                onChange={(e) => setSimulateMode(e.target.checked)}
                className="w-4 h-4 accent-sage rounded cursor-pointer"
              />
            </div>

            {/* Execute Button */}
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="w-full py-3.5 rounded-xl bg-cream hover:bg-cream-dim text-metallic-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-glow-sage disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <span className="w-4 h-4 border-2 border-metallic-950 border-t-transparent rounded-full animate-spin" />
                  <span>DISBURSING VIA PAYPAL BATCH API...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    EXECUTE BATCH PAYOUT ({currency} {totalPrize.toLocaleString()})
                  </span>
                </>
              )}
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
