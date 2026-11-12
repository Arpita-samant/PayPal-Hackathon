import React, { useState } from 'react';
import { FairnessReport, TeamMember } from '../types';
import { 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  Send, 
  FileCode2, 
  Layers, 
  ExternalLink 
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

  const getMemberFlagReason = (username: string) => {
    const m = members.find((x) => x.github_username === username);
    return m?.flag_reason;
  };

  const filteredCommits = report.commits.filter((c) => {
    if (filterCategory === 'all') return true;
    return c.category === filterCategory;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Top Banner: Status & Consensus Locking */}
      <div className="glass-panel rounded-2xl p-6 border border-metallic-800 shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sage text-xs font-mono uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sage animate-ping" />
            <span>AI Fairness Engine // Analysis Complete</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-cream">
            Contribution Audit & Settlement
          </h2>
          <p className="text-xs sm:text-sm text-metallic-400 mt-1 max-w-2xl">
            {report.executive_summary}
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          {isPaid ? (
            <div className="px-4 py-2.5 rounded-xl border border-signal-green/40 bg-signal-green/10 text-signal-green text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>PAYOUT SETTLED VIA PAYPAL</span>
            </div>
          ) : (
            <button
              onClick={onProceedPayout}
              className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 bg-sage text-metallic-950 hover:bg-cream shadow-glow cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>REVIEW & TUNE SPLITS</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Factor Mathematical Formula Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-xl border border-metallic-800">
          <div className="text-[10px] font-mono uppercase text-metallic-500">Weight 01</div>
          <div className="text-lg font-mono font-bold text-cream mt-0.5">40%</div>
          <div className="text-xs text-metallic-300 font-medium">AST & Cyclomatic Logic</div>
          <div className="text-[10px] text-metallic-500 mt-1">Deep complexity evaluation</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-metallic-800">
          <div className="text-[10px] font-mono uppercase text-metallic-500">Weight 02</div>
          <div className="text-lg font-mono font-bold text-cream mt-0.5">30%</div>
          <div className="text-xs text-metallic-300 font-medium">Architectural Impact</div>
          <div className="text-[10px] text-metallic-500 mt-1">Core vectors & data pipelines</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-metallic-800">
          <div className="text-[10px] font-mono uppercase text-metallic-500">Weight 03</div>
          <div className="text-lg font-mono font-bold text-cream mt-0.5">15%</div>
          <div className="text-xs text-metallic-300 font-medium">PR Reviews & Activity</div>
          <div className="text-[10px] text-metallic-500 mt-1">Collaboration rhythm</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-metallic-800">
          <div className="text-[10px] font-mono uppercase text-metallic-500">Weight 04</div>
          <div className="text-lg font-mono font-bold text-cream mt-0.5">15%</div>
          <div className="text-xs text-metallic-300 font-medium">Normalized Volume</div>
          <div className="text-[10px] text-metallic-500 mt-1">Lockfile & boilerplate discounted</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-metallic-800 pb-2">
        <button
          onClick={() => setActiveTab('contributors')}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'contributors'
              ? 'bg-metallic-800 text-cream border border-metallic-700'
              : 'text-metallic-400 hover:text-cream'
          }`}
        >
          CONTRIBUTOR SPLITS ({report.breakdown.length})
        </button>
        <button
          onClick={() => setActiveTab('commits')}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'commits'
              ? 'bg-metallic-800 text-cream border border-metallic-700'
              : 'text-metallic-400 hover:text-cream'
          }`}
        >
          AUDITED COMMITS LEDGER ({report.commits.length})
        </button>
      </div>

      {/* Tab 1: Contributors Grid */}
      {activeTab === 'contributors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.breakdown.map((item) => {
            const status = getMemberStatus(item.github_username);
            const flagReason = getMemberFlagReason(item.github_username);

            return (
              <div
                key={item.github_username}
                className="glass-panel rounded-2xl p-5 border border-metallic-800 hover:border-metallic-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top: Handle, Percentage & Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl border border-metallic-700 bg-metallic-850 flex items-center justify-center font-mono font-bold text-sm text-cream uppercase">
                        {item.github_username.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold text-cream">
                          @{item.github_username}
                        </div>
                        <div className="text-[11px] text-metallic-500 font-mono">
                          {item.total_commits} commits // {item.high_impact_commit_count} high-impact
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-mono font-bold text-sage">
                        {item.calculated_percentage}%
                      </div>
                      <div className="text-xs font-mono font-medium text-cream">
                        {currency} {item.payout_share.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Role Distribution Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-[10px] font-mono text-metallic-400 uppercase">
                      <span>Domain Breakdown</span>
                      <span>Avg Comp: {item.avg_complexity} / 10.0</span>
                    </div>
                    <div className="h-2 w-full bg-metallic-900 rounded-full overflow-hidden flex">
                      {Object.entries(item.role_distribution).map(([cat, pct]) => {
                        let color = 'bg-metallic-600';
                        if (cat === 'architecture') color = 'bg-cream';
                        if (cat === 'backend') color = 'bg-sage';
                        if (cat === 'frontend') color = 'bg-signal-orange';
                        if (cat === 'devops') color = 'bg-signal-green';
                        return (
                          <div
                            key={cat}
                            style={{ width: `${pct}%` }}
                            className={`${color} h-full`}
                            title={`${cat}: ${pct}%`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[9px] font-mono text-metallic-500 pt-0.5">
                      {Object.entries(item.role_distribution).map(([cat, pct]) => (
                        <span key={cat} className="capitalize">
                          {cat} {pct}%
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Flag Reason notice if any */}
                  {status === 'flagged' && flagReason && (
                    <div className="p-2.5 rounded-lg border border-signal-red/30 bg-signal-red/10 text-signal-red text-xs font-mono mb-3 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>FLAGGED: {flagReason}</span>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-metallic-850 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-mono">
                    <span className="text-metallic-500">STATUS:</span>
                    {status === 'approved' ? (
                      <span className="text-signal-green font-medium flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>APPROVED</span>
                      </span>
                    ) : status === 'flagged' ? (
                      <span className="text-signal-red font-medium">FLAGGED</span>
                    ) : (
                      <span className="text-metallic-400 font-medium">AWAITING APPROVAL</span>
                    )}
                  </div>

                  {!isPaid && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onOpenDispute(item.github_username)}
                        className="px-2.5 py-1 rounded-md border border-metallic-800 hover:border-metallic-700 bg-metallic-900/60 text-[11px] font-mono text-metallic-400 hover:text-cream transition-colors flex items-center space-x-1"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Dispute</span>
                      </button>

                      {status !== 'approved' && (
                        <button
                          onClick={() => onApprove(item.github_username)}
                          className="px-2.5 py-1 rounded-md border border-sage/40 bg-sage/10 hover:bg-sage/20 text-[11px] font-mono text-sage transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Commits Ledger */}
      {activeTab === 'commits' && (
        <div className="glass-panel rounded-2xl border border-metallic-800 overflow-hidden">
          
          {/* Category Filter Pills */}
          <div className="p-4 border-b border-metallic-800 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-mono text-metallic-500 mr-2">FILTER:</span>
            {['all', 'architecture', 'backend', 'frontend', 'devops', 'boilerplate'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono uppercase transition-colors ${
                  filterCategory === cat
                    ? 'bg-metallic-700 text-cream'
                    : 'bg-metallic-900/60 text-metallic-400 hover:text-cream border border-metallic-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="divide-y divide-metallic-850">
            {filteredCommits.map((c) => {
              const isBoilerplate = c.category === 'boilerplate';

              return (
                <div key={c.commit_hash} className="p-4 hover:bg-metallic-900/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    
                    <div className="flex items-start space-x-3">
                      <span className="font-mono text-xs text-metallic-500 font-bold px-1.5 py-0.5 rounded bg-metallic-900 border border-metallic-800">
                        {c.commit_hash}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-cream flex items-center space-x-2">
                          <span>{c.message}</span>
                        </div>
                        <div className="text-xs text-metallic-500 font-mono flex items-center space-x-2 mt-0.5">
                          <span>@{c.author_username}</span>
                          <span>•</span>
                          <span className="text-signal-green">+{c.additions}</span>
                          <span className="text-signal-red">-{c.deletions}</span>
                          <span>•</span>
                          <span className="text-metallic-400">{c.impact_summary}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-start sm:self-auto shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                          isBoilerplate
                            ? 'border-signal-orange/40 text-signal-orange bg-signal-orange/10'
                            : c.category === 'architecture'
                            ? 'border-cream/40 text-cream bg-cream/10'
                            : 'border-sage/40 text-sage bg-sage/10'
                        }`}
                      >
                        {c.category}
                      </span>
                      <span className="text-xs font-mono text-metallic-400">
                        Comp: <strong className="text-cream">{c.complexity_score}</strong>/10
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
