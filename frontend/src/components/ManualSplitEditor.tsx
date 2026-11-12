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
  Sparkles 
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

  const handlePercentageChange = (memberId: string, newPctVal: number) => {
    const pct = Math.max(0, Math.min(100, newPctVal));
    const amt = round2((pct / 100.0) * totalPrize);

    setSplits((prev) => ({
      ...prev,
      [memberId]: { pct, amt },
    }));
  };

  const handleAmountChange = (memberId: string, newAmtVal: number) => {
    const amt = Math.max(0, Math.min(totalPrize, newAmtVal));
    const pct = round2((amt / totalPrize) * 100.0);

    setSplits((prev) => ({
      ...prev,
      [memberId]: { pct, amt },
    }));
  };

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

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
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 border border-metallic-700 bg-metallic-900/90 shadow-glass space-y-5 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-metallic-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cream">
            Fine-Tune Prize Distribution
          </h2>
          <p className="text-xs sm:text-sm text-metallic-400 mt-1 max-w-2xl">
            Modify splits via direct percentage or monetary amount. Values automatically synchronize and notify the team for re-approval.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="p-1 rounded-xl bg-metallic-950 border border-metallic-800 flex items-center space-x-1">
            <button
              onClick={() => setMode('percentage')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center space-x-1.5 ${
                mode === 'percentage'
                  ? 'bg-sage text-metallic-950 font-bold'
                  : 'text-metallic-400 hover:text-cream'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>PERCENT (%)</span>
            </button>

            <button
              onClick={() => setMode('amount')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center space-x-1.5 ${
                mode === 'amount'
                  ? 'bg-sage text-metallic-950 font-bold'
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
            className="px-3 py-1.5 rounded-xl border border-metallic-800 bg-metallic-950 hover:bg-metallic-850 text-metallic-300 hover:text-cream text-xs font-mono transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Restore original AI-calculated split"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sage" />
            <span>RESTORE AI</span>
          </button>

          {/* Revision History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1.5 rounded-xl border border-metallic-800 bg-metallic-950 hover:bg-metallic-850 text-metallic-300 hover:text-cream text-xs font-mono transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-cream" />
            <span>LOG ({team.distribution_history?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Unallocated Pool Live Monitor Bar */}
      <div
        className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs ${
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
            <div className="font-bold uppercase tracking-wider text-xs">
              {isValidAllocation ? '100% Balanced Allocation' : 'Distribution Discrepancy'}
            </div>
            <div className="text-[11px] opacity-90">
              {isValidAllocation
                ? `Total prize pool of ${currency} ${totalPrize.toLocaleString()} is fully assigned.`
                : `Must equal exactly 100.0% (${currency} ${totalPrize.toLocaleString()}) to proceed.`}
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right font-bold text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-current/20">
          <div>Allocated: {currentTotalPct.toFixed(1)}% ({currency} {currentTotalAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })})</div>
          <div>Remaining: {unallocatedPct.toFixed(1)}% ({currency} {unallocatedAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })})</div>
        </div>
      </div>

      {/* Split Table / Sliders */}
      <div className="space-y-3">
        {eligibleMembers.map((member) => {
          const s = splits[member.id] || { pct: 0, amt: 0 };

          return (
            <div
              key={member.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-metallic-950/60 border border-metallic-800 hover:border-metallic-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
            >
              {/* Member Meta */}
              <div className="flex items-center space-x-3 w-full md:w-56 shrink-0">
                <div className="w-9 h-9 rounded-xl border border-metallic-700 bg-metallic-850 flex items-center justify-center font-mono font-bold text-xs text-cream uppercase shrink-0">
                  {member.github_username.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-cream font-mono truncate">
                    {member.name}
                  </div>
                  <div className="text-[11px] text-metallic-400 font-mono truncate">
                    @{member.github_username}
                  </div>
                  <div className="text-[10px] text-sage font-mono mt-0.5">
                    AI Rec: {member.ai_contribution_pct}%
                  </div>
                </div>
              </div>

              {/* Slider for smooth visual adjustment */}
              <div className="w-full flex-1 px-1 sm:px-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={s.pct}
                  onChange={(e) => handlePercentageChange(member.id, parseFloat(e.target.value))}
                  className="w-full accent-sage h-2 bg-metallic-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Inputs for Percentage and Amount */}
              <div className="grid grid-cols-2 gap-2 w-full md:w-64 shrink-0">
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={s.pct}
                    onChange={(e) => handlePercentageChange(member.id, parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-metallic-900 border border-metallic-700 text-cream text-xs font-mono text-right focus:border-sage focus:outline-none"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] font-mono text-metallic-500 pointer-events-none">
                    %
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-[10px] font-mono text-metallic-500 pointer-events-none">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={totalPrize}
                    value={s.amt}
                    onChange={(e) => handleAmountChange(member.id, parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-metallic-900 border border-metallic-700 text-cream text-xs font-mono text-right focus:border-sage focus:outline-none"
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
            placeholder="e.g. Extra merit bonus for core architecture and API fixes"
            className="w-full px-3.5 py-2.5 rounded-xl bg-metallic-950 border border-metallic-800 text-cream text-xs font-sans focus:outline-none focus:border-sage"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs font-mono text-metallic-400">
            {isValidAllocation ? (
              <span className="text-signal-green">Ready to apply. Member approvals will reset for consensus.</span>
            ) : (
              <span className="text-signal-orange">Distribution must equal {currency} {totalPrize.toLocaleString()} (100%).</span>
            )}
          </div>

          <button
            onClick={handleSaveSplit}
            disabled={!isValidAllocation || isSaving}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              isValidAllocation && !isSaving
                ? 'bg-sage text-metallic-950 hover:bg-cream shadow-glow cursor-pointer'
                : 'bg-metallic-800 text-metallic-500 border border-metallic-700 cursor-not-allowed opacity-60'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'SAVING REVISION...' : 'APPLY MANUAL OVERRIDE'}</span>
          </button>
        </div>
      </div>

      {/* Revision History Drawer */}
      {showHistory && (
        <div className="mt-4 p-4 rounded-2xl border border-metallic-800 bg-metallic-950/70 font-mono text-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-metallic-850">
            <span className="font-bold text-cream">Revision Audit Trail</span>
            <span className="text-metallic-500">{team.distribution_history?.length || 0} Events Recorded</span>
          </div>
          {team.distribution_history && team.distribution_history.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {team.distribution_history.map((rev, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-metallic-900 border border-metallic-850 space-y-1">
                  <div className="flex justify-between text-[11px] text-metallic-400">
                    <span className="text-sage font-bold">{rev.type.toUpperCase()} by {rev.modified_by}</span>
                    <span>{new Date(rev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-cream text-[11px]">{rev.reason}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-metallic-500 text-center py-2">No manual changes recorded yet.</p>
          )}
        </div>
      )}

    </div>
  );
};
