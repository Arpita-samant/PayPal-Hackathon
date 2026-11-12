import React, { useState } from 'react';
import { FairnessReport, TeamMember } from '../types';
import { 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  FileCode2, 
  Layers 
} from 'lucide-react';

interface FairnessReportViewProps {
  report: FairnessReport;
  members: TeamMember[];
  totalPrize: number;
  currency: string;
  onOpenDispute: (username: string) => void;
  onApprove: (username: string) => void;
  onProceedPayout: () => void;
  isPaid: boolean;
}

export const FairnessReportView: React.FC<FairnessReportViewProps> = ({
  report,
  members,
  totalPrize,
  currency,
  onOpenDispute,
  onApprove,
  onProceedPayout,
  isPaid,
}) => {
  const [activeTab, setActiveTab] = useState<'contributors' | 'commits'>('contributors');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const getMemberStatus = (username: string) => {
    const m = members.find((x) => x.github_username === username);
    return m?.approval_status || 'pending';
  };

  const filteredCommits = report.commits.filter((c) => {
    if (filterCategory === 'all') return true;
    return c.category === filterCategory;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Top Banner: Status & Action */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-metallic-800 shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sage text-xs font-mono uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-sage animate-ping" />
            <span>AI Fairness Engine // Analysis Complete</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cream">
            Contribution Audit & Settlement
          </h2>
          <p className="text-xs sm:text-sm text-metallic-400 mt-1 max-w-2xl">
            {report.executive_summary}
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex items-center space-x-3 self-stretch sm:self-auto">
          {isPaid ? (
            <div className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-signal-green/40 bg-signal-green/10 text-signal-green text-xs font-mono flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>PAYOUT SETTLED VIA PAYPAL</span>
            </div>
          ) : (
            <button
              onClick={onProceedPayout}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 bg-sage text-metallic-950 hover:bg-cream shadow-glow cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>REVIEW & TUNE SPLITS</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Factor Mathematical Formula Gauges */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-metallic-800 space-y-3">
        <div className="text-xs font-mono text-metallic-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-sage" />
          <span>Algorithmic Weighting Vector</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          {Object.entries(report.formula_weights).map(([key, weight]) => (
            <div key={key} className="p-3 rounded-xl bg-metallic-950/70 border border-metallic-850">
              <div className="text-[10px] font-mono text-metallic-400 uppercase truncate">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-cream mt-0.5">
                {(weight * 100).toFixed(0)}%
              </div>
              <div className="w-full bg-metallic-800 h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-sage h-full rounded-full transition-all duration-500"
                  style={{ width: `${weight * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Switcher: Contributors vs Commits */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-metallic-800 pb-3">
        <div className="flex items-center space-x-1 bg-metallic-950 p-1 rounded-xl border border-metallic-800 self-start">
          <button
            onClick={() => setActiveTab('contributors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'contributors'
                ? 'bg-metallic-850 text-cream font-bold border border-metallic-700'
                : 'text-metallic-400 hover:text-cream'
            }`}
          >
            CONTRIBUTORS ({report.breakdown.length})
          </button>
          <button
            onClick={() => setActiveTab('commits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              activeTab === 'commits'
                ? 'bg-metallic-850 text-cream font-bold border border-metallic-700'
                : 'text-metallic-400 hover:text-cream'
            }`}
          >
            AUDITED COMMITS ({report.commits.length})
          </button>
        </div>

        {activeTab === 'commits' && (
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-mono">
            {['all', 'frontend', 'backend', 'architecture', 'boilerplate'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] uppercase transition-colors shrink-0 ${
                  filterCategory === cat
                    ? 'bg-sage text-metallic-950 font-bold'
                    : 'bg-metallic-900 text-metallic-400 hover:text-cream border border-metallic-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab: Contributors Breakdown */}
      {activeTab === 'contributors' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.breakdown.map((item) => {
            const status = getMemberStatus(item.github_username);

            return (
              <div
                key={item.github_username}
                className="glass-panel rounded-2xl p-4 sm:p-5 border border-metallic-800 bg-metallic-900/60 hover:border-metallic-700 transition-all space-y-4"
              >
                {/* Header Line */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-metallic-850 border border-metallic-700 flex items-center justify-center font-mono font-bold text-xs text-cream uppercase shrink-0">
                      {item.github_username.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm sm:text-base text-cream font-mono truncate">
                        {item.name}
                      </div>
                      <div className="text-xs font-mono text-metallic-400 truncate">
                        @{item.github_username}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg sm:text-xl font-bold font-mono text-sage">
                      {item.calculated_percentage}%
                    </div>
                    <div className="text-xs font-mono text-cream font-medium">
                      {currency} {item.payout_share.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Progress Visual */}
                <div>
                  <div className="w-full bg-metallic-950 h-2 rounded-full overflow-hidden border border-metallic-800">
                    <div
                      className="bg-sage h-full rounded-full transition-all duration-700"
                      style={{ width: `${item.calculated_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Algorithmic Factor Scores */}
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1 border-t border-metallic-850/80">
                  <div className="p-2 rounded-lg bg-metallic-950/70 border border-metallic-850">
                    <div className="text-[10px] text-metallic-400 uppercase">Complexity</div>
                    <div className="font-bold text-cream mt-0.5">{item.score_details.complexity_rating.toFixed(1)}/10</div>
                  </div>
                  <div className="p-2 rounded-lg bg-metallic-950/70 border border-metallic-850">
                    <div className="text-[10px] text-metallic-400 uppercase">Impact</div>
                    <div className="font-bold text-cream mt-0.5">{item.score_details.impact_factor.toFixed(1)}x</div>
                  </div>
                  <div className="p-2 rounded-lg bg-metallic-950/70 border border-metallic-850">
                    <div className="text-[10px] text-metallic-400 uppercase">Commits</div>
                    <div className="font-bold text-cream mt-0.5">{item.total_commits}</div>
                  </div>
                </div>

                {/* Approval Status & Dispute Action */}
                <div className="pt-1 flex items-center justify-between text-xs font-mono">
                  <div>
                    {status === 'approved' ? (
                      <span className="text-signal-green flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Consensus Approved</span>
                      </span>
                    ) : status === 'flagged' ? (
                      <span className="text-signal-red flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Disputed</span>
                      </span>
                    ) : (
                      <span className="text-metallic-400 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Vote</span>
                      </span>
                    )}
                  </div>

                  {!isPaid && (
                    <div className="flex items-center space-x-2">
                      {status !== 'approved' && (
                        <button
                          onClick={() => onApprove(item.github_username)}
                          className="px-2.5 py-1 rounded-lg bg-sage/10 text-sage hover:bg-sage/20 border border-sage/30 text-[11px] transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => onOpenDispute(item.github_username)}
                        className="px-2.5 py-1 rounded-lg border border-metallic-800 text-metallic-400 hover:text-signal-red hover:border-signal-red/30 text-[11px] transition-colors"
                      >
                        Dispute
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Tab: Audited Commits Log */
        <div className="space-y-2.5">
          {filteredCommits.map((c) => (
            <div
              key={c.commit_hash}
              className="p-3.5 sm:p-4 rounded-xl border border-metallic-800 bg-metallic-950/70 font-mono text-xs space-y-2 hover:border-metallic-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1 border-b border-metallic-850">
                <div className="flex items-center space-x-2">
                  <span className="text-sage font-bold">@{c.author_username}</span>
                  <span className="text-metallic-500">•</span>
                  <span className="text-cream truncate max-w-xs sm:max-w-md">{c.message}</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-metallic-400">
                  <span className="px-1.5 py-0.5 rounded bg-metallic-900 border border-metallic-800 uppercase">
                    {c.category}
                  </span>
                  <span>{c.commit_hash.slice(0, 7)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-metallic-400">
                <div className="flex items-center space-x-3">
                  <span className="text-signal-green">+{c.additions}</span>
                  <span className="text-signal-red">-{c.deletions}</span>
                  <span>{c.files_changed} files</span>
                </div>
                <div>
                  Complexity: <strong className="text-cream">{c.complexity_score.toFixed(1)}/10</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
