import React, { useState, useEffect } from 'react';
import { Team, TeamMember } from '../types';
import { 
  Percent, 
  Coins, 
  RotateCcw, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  Sparkles,
  Info
} from 'lucide-react';

interface ManualSplitEditorProps {
  team: Team;
  onApplyManualSplit: (data: {
    mode: 'percentage' | 'amount';
    splits: Array<{ member_id: string; percentage?: number; amount?: number }>;
    reason?: string;
  }) => Promise<void>;
  onResetToAi: () => Promise<void>;
  isConsensusReached: boolean;
}

export const ManualSplitEditor: React.FC<ManualSplitEditorProps> = ({
  team,
  onApplyManualSplit,
  onResetToAi,
  isConsensusReached,
}) => {
  const [mode, setMode] = useState<'percentage' | 'amount'>('percentage');
  const [splits, setSplits] = useState<Record<string, { pct: number; amt: number }>>({});
  const [reason, setReason] = useState('Merit-based rebalance of hackathon contributions');
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const eligibleMembers = team.members.filter((m) => m.is_eligible);
  const totalPrize = team.total_prize_amount;
  const currency = team.currency;

  // Initialize splits state from current team member values
  useEffect(() => {
    const initial: Record<string, { pct: number; amt: number }> = {};
    for (const m of eligibleMembers) {
      initial[m.id] = {
        pct: m.final_percentage || 0,
        amt: m.payout_amount || 0,
      };
    }
    setSplits(initial);
  }, [team]);

  // Handle Percentage change: automatically recalculate amount
  const handlePercentageChange = (memberId: string, newPctVal: number) => {
    const pct = Math.max(0, Math.min(100, newPctVal));
    const amt = round2((pct / 100.0) * totalPrize);

    setSplits((prev) => ({
      ...prev,
      [memberId]: { pct, amt },
    }));
  };

  // Handle Amount change: automatically recalculate percentage
  const handleAmountChange = (memberId: string, newAmtVal: number) => {
    const amt = Math.max(0, Math.min(totalPrize, newAmtVal));
    const pct = round2((amt / totalPrize) * 100.0);

    setSplits((prev) => ({
      ...prev,
      [memberId]: { pct, amt },
    }));
  };

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  // Calculate totals
  const currentTotalPct = round2(Object.values(splits).reduce((sum, item) => sum + item.pct, 0));
  const currentTotalAmt = round2(Object.values(splits).reduce((sum, item) => sum + item.amt, 0));
  
  const unallocatedPct = round2(100.0 - currentTotalPct);
  const unallocatedAmt = round2(totalPrize - currentTotalAmt);

  const isValidAllocation = Math.abs(unallocatedPct) <= 0.05 && Math.abs(unallocatedAmt) <= 0.1;

  const handleSaveSplit = async () => {
    if (!isValidAllocation) return;
    setIsSaving(true);
    try {
      const payloadSplits = eligibleMembers.map((m) => ({
        member_id: m.id,
        percentage: splits[m.id]?.pct ?? 0,
        amount: splits[m.id]?.amt ?? 0,
      }));

      await onApplyManualSplit({
        mode,
        splits: payloadSplits,
        reason: reason.trim() || 'Manual merit adjustment by leader',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-metallic-800 shadow-glass space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-metallic-800">
        <div>
          <div className="flex items-center space-x-2 text-sage text-xs font-mono uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sage" />
            <span>Section D // Manual Money Splitting (Mandatory)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cream">
            Fine-Tune Distribution
          </h2>
          <p className="text-xs sm:text-sm text-metallic-400 mt-1 max-w-2xl">
            Leader override controls. Modify splits via direct percentage or monetary amount. Changes automatically synchronize both values and notify the team for re-approval.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Mode Switcher */}
          <div className="p-1 rounded-xl bg-metallic-900 border border-metallic-800 flex items-center space-x-1">
            <button
              onClick={() => setMode('percentage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center space-x-1.5 ${
                mode === 'percentage'
                  ? 'bg-metallic-800 text-cream border border-metallic-700 shadow-sm'
                  : 'text-metallic-400 hover:text-cream'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>PERCENTAGE (%)</span>
            </button>

            <button
              onClick={() => setMode('amount')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center space-x-1.5 ${
                mode === 'amount'
                  ? 'bg-metallic-800 text-cream border border-metallic-700 shadow-sm'
                  : 'text-metallic-400 hover:text-cream'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>AMOUNT ({currency})</span>
            </button>
          </div>

          {/* Reset to AI Button */}
          <button
            onClick={onResetToAi}
            className="px-3 py-1.5 rounded-xl border border-metallic-800 bg-metallic-900/60 hover:bg-metallic-850 text-metallic-300 hover:text-cream text-xs font-mono transition-colors flex items-center space-x-1.5"
            title="Restore original AI-calculated split"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sage" />
            <span>RESTORE AI</span>
          </button>

          {/* Revision History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1.5 rounded-xl border border-metallic-800 bg-metallic-900/60 hover:bg-metallic-850 text-metallic-300 hover:text-cream text-xs font-mono transition-colors flex items-center space-x-1.5"
          >
            <History className="w-3.5 h-3.5 text-cream" />
            <span>HISTORY ({team.distribution_history?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Unallocated Pool Live Monitor Bar */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs ${
          isValidAllocation
            ? 'bg-signal-green/10 border-signal-green/30 text-signal-green'
            : 'bg-signal-orange/10 border-signal-orange/30 text-signal-orange'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          {isValidAllocation ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
          )}
          <div>
            <div className="font-bold uppercase tracking-wider">
              {isValidAllocation ? 'Allocation Complete (100% Balanced)' : 'Distribution Discrepancy'}
            </div>
            <div className="text-[11px] opacity-90">
              {isValidAllocation
                ? `Total prize pool of ${currency} ${totalPrize.toLocaleString()} is fully assigned.`
                : `Total must equal exactly 100.0% (${currency} ${totalPrize.toLocaleString()}). You cannot proceed until balanced.`}
            </div>
          </div>
        </div>

        <div className="text-right sm:self-auto font-bold">
          <div>Allocated: {currentTotalPct.toFixed(1)}% / {currency} {currentTotalAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div>Remaining: {unallocatedPct.toFixed(1)}% / {currency} {unallocatedAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Split Table / Sliders */}
      <div className="space-y-3">
        {eligibleMembers.map((member) => {
          const s = splits[member.id] || { pct: 0, amt: 0 };

          return (
            <div
              key={member.id}
              className="p-4 rounded-xl bg-metallic-900/60 border border-metallic-800 hover:border-metallic-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Member Meta */}
              <div className="flex items-center space-x-3 w-full md:w-56 shrink-0">
                <div className="w-9 h-9 rounded-lg border border-metallic-700 bg-metallic-850 flex items-center justify-center font-mono font-bold text-xs text-cream uppercase">
                  {member.github_username.slice(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-cream font-mono">
                    {member.name}
                  </div>
                  <div className="text-[11px] text-metallic-400 font-mono">
                    @{member.github_username}
                  </div>
                  <div className="text-[10px] text-metallic-500 font-mono mt-0.5">
                    AI Rec: {member.ai_contribution_pct}%
                  </div>
                </div>
              </div>

              {/* Slider for smooth visual adjustment */}
              <div className="flex-1 w-full px-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={s.pct}
                  onChange={(e) => handlePercentageChange(member.id, parseFloat(e.target.value))}
                  className="w-full accent-sage h-1.5 bg-metallic-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Inputs for Mode: Percentage or Amount */}
              <div className="flex items-center space-x-3 w-full md:w-72 justify-end">
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={s.pct}
                    onChange={(e) => handlePercentageChange(member.id, parseFloat(e.target.value) || 0)}
                    className="w-24 px-2.5 py-1.5 rounded-lg bg-metallic-950 border border-metallic-700 text-cream text-xs font-mono text-right focus:border-sage focus:outline-none"
                  />
                  <span className="absolute right-2 top-2 text-[10px] font-mono text-metallic-500 pointer-events-none">
                    %
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[10px] font-mono text-metallic-500 pointer-events-none">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={totalPrize}
                    value={s.amt}
                    onChange={(e) => handleAmountChange(member.id, parseFloat(e.target.value) || 0)}
                    className="w-32 pl-7 pr-2.5 py-1.5 rounded-lg bg-metallic-950 border border-metallic-700 text-cream text-xs font-mono text-right focus:border-sage focus:outline-none"
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Change Reason & Commit Split */}
      <div className="space-y-3 pt-2 border-t border-metallic-850">
        <div>
          <label className="block text-xs font-mono text-metallic-400 mb-1">
            Reason for Adjustment (Mandatory Audit Trail)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Extra merit bonus for database architecting and late-night API fixes"
            className="w-full px-3.5 py-2 rounded-lg bg-metallic-900 border border-metallic-800 text-cream text-xs font-sans focus:outline-none focus:border-sage"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-metallic-500 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-sage shrink-0" />
            <span>Applying a manual split will notify all team members and reset approvals to "pending".</span>
          </div>

          <button
            onClick={handleSaveSplit}
            disabled={!isValidAllocation || isSaving}
            className="px-6 py-2.5 rounded-xl bg-cream hover:bg-cream-dim text-metallic-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-glow-sage disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {isSaving ? (
              <span>SAVING & REBALANCING...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>SAVE & UPDATE DISTRIBUTION</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Revision History Dropdown */}
      {showHistory && (
        <div className="p-4 rounded-xl bg-metallic-950/80 border border-metallic-800 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-cream font-bold">
            <History className="w-4 h-4 text-sage" />
            <span>Complete Distribution Revision History</span>
          </div>

          {(!team.distribution_history || team.distribution_history.length === 0) ? (
            <div className="text-xs font-mono text-metallic-500">No manual revisions recorded yet.</div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {team.distribution_history.map((rev, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-metallic-900/60 border border-metallic-850 text-xs font-mono">
                  <div className="flex justify-between text-metallic-400 pb-1 mb-1 border-b border-metallic-850">
                    <span className="text-sage font-bold uppercase">{rev.type} Revision</span>
                    <span>{new Date(rev.timestamp).toLocaleString()} by {rev.modified_by}</span>
                  </div>
                  <div className="text-cream mb-1 italic font-sans text-xs">"{rev.reason}"</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[11px] text-metallic-400">
                    {rev.changes?.map((c, cIdx) => (
                      <div key={cIdx}>
                        @{c.username}: {c.old_pct}% &rarr; <span className="text-sage">{c.new_pct}%</span> ({currency} {c.new_amount})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
