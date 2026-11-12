import React, { useState } from 'react';
import { SupportedCurrency, Team } from '../types';
import { DollarSign, Users, CheckCircle2, AlertTriangle, Edit3, Check } from 'lucide-react';

interface PrizePoolBarProps {
  team: Team;
  onUpdatePrize: (amount: number, currency: SupportedCurrency) => Promise<void>;
  unallocatedPct: number;
  unallocatedAmount: number;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
  SGD: 'S$',
  JPY: '¥',
  AED: 'AED ',
  CHF: 'CHF ',
};

export const PrizePoolBar: React.FC<PrizePoolBarProps> = ({
  team,
  onUpdatePrize,
  unallocatedPct,
  unallocatedAmount,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempAmount, setTempAmount] = useState(team.total_prize_amount.toString());
  const [tempCurrency, setTempCurrency] = useState<SupportedCurrency>(team.currency);
  const [isSaving, setIsSaving] = useState(false);

  const eligibleCount = team.members.filter((m) => m.is_eligible).length;
  const isPerfectSplit = Math.abs(unallocatedPct) < 0.05 && Math.abs(unallocatedAmount) < 0.1;
  const sym = CURRENCY_SYMBOLS[team.currency] || `${team.currency} `;

  const handleSave = async () => {
    const parsed = parseFloat(tempAmount);
    if (isNaN(parsed) || parsed <= 0) return;
    setIsSaving(true);
    try {
      await onUpdatePrize(parsed, tempCurrency);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-metallic-800 shadow-glass space-y-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Project & Leader */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-metallic-900 border border-metallic-700 flex items-center justify-center font-mono font-bold text-sage shrink-0">
            {team.currency}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-y-1">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-cream font-mono truncate">
                {team.name}
              </h2>
              {team.hackathon_name && (
                <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-sage/10 border border-sage/30 text-sage truncate max-w-[140px] sm:max-w-none">
                  {team.hackathon_name}
                </span>
              )}
              {team.hackathon_duration && (
                <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-metallic-850 border border-metallic-700 text-metallic-300">
                  {team.hackathon_duration}
                </span>
              )}
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-metallic-800 border border-metallic-700 text-metallic-300 uppercase">
                {team.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-metallic-400 font-mono mt-0.5 truncate">
              Leader: <strong className="text-cream">{team.leader_name}</strong> • Repo: {team.repo_owner}/{team.repo_name}
            </p>
          </div>
        </div>

        {/* Center/Right: Metrics & Unallocated Amount Monitor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto">
          
          {/* Total Prize Pool */}
          <div className="px-3.5 py-2.5 rounded-xl bg-metallic-900/80 border border-metallic-800 flex items-center space-x-2.5">
            <DollarSign className="w-4 h-4 text-sage shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[9px] sm:text-[10px] font-mono uppercase text-metallic-500">Total Prize Pool</div>
              {isEditing ? (
                <div className="flex items-center space-x-1 mt-1">
                  <select
                    value={tempCurrency}
                    onChange={(e) => setTempCurrency(e.target.value as SupportedCurrency)}
                    className="bg-metallic-950 border border-metallic-700 rounded px-1 py-0.5 text-xs text-cream font-mono focus:outline-none"
                  >
                    {['USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'JPY', 'AED', 'CHF'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={tempAmount}
                    onChange={(e) => setTempAmount(e.target.value)}
                    className="w-20 bg-metallic-950 border border-metallic-700 rounded px-1.5 py-0.5 text-xs text-cream font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="p-1 rounded bg-sage text-metallic-950 hover:bg-cream"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs sm:text-sm font-bold text-cream font-mono truncate">
                    {sym} {team.total_prize_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  {team.status !== 'paid' && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-metallic-500 hover:text-cream transition-colors p-0.5"
                      title="Edit prize pool or currency"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active Participants */}
          <div className="px-3.5 py-2.5 rounded-xl bg-metallic-900/80 border border-metallic-800 flex items-center space-x-2.5">
            <Users className="w-4 h-4 text-cream shrink-0" />
            <div>
              <div className="text-[9px] sm:text-[10px] font-mono uppercase text-metallic-500">Participants</div>
              <div className="text-xs sm:text-sm font-bold text-cream font-mono">
                {eligibleCount} <span className="text-[11px] text-metallic-500">/ {team.members.length}</span>
              </div>
            </div>
          </div>

          {/* Live Unallocated Split Indicator */}
          <div
            className={`px-3.5 py-2.5 rounded-xl border flex items-center space-x-2.5 transition-colors ${
              isPerfectSplit
                ? 'bg-signal-green/10 border-signal-green/30 text-signal-green'
                : 'bg-signal-orange/10 border-signal-orange/30 text-signal-orange'
            }`}
          >
            {isPerfectSplit ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[9px] sm:text-[10px] font-mono uppercase">
                {isPerfectSplit ? '100% Balanced' : 'Unallocated'}
              </div>
              <div className="text-[11px] sm:text-xs font-bold font-mono truncate">
                {isPerfectSplit ? (
                  <span>0.0% left</span>
                ) : (
                  <span>
                    {unallocatedPct > 0 ? `+${unallocatedPct.toFixed(1)}%` : `${unallocatedPct.toFixed(1)}%`} ({sym}{Math.abs(unallocatedAmount).toFixed(0)})
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
