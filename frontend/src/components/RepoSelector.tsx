import React, { useState } from 'react';
import { GitPullRequest, Clock, DollarSign, ArrowRight, Sparkles } from 'lucide-react';

interface RepoSelectorProps {
  onSubmit: (data: { name: string; repo_url: string; total_prize_amount: number; timeframe_hours: number }) => void;
  isLoading: boolean;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({ onSubmit, isLoading }) => {
  const [name, setName] = useState('Nexus AI Autonomous Agent');
  const [repoUrl, setRepoUrl] = useState('https://github.com/meta-hackathon/super-agent-ai');
  const [prizeAmount, setPrizeAmount] = useState('10000');
  const [timeframeHours, setTimeframeHours] = useState(36);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !repoUrl.trim()) return;
    onSubmit({
      name,
      repo_url: repoUrl,
      total_prize_amount: parseFloat(prizeAmount) || 1000,
      timeframe_hours: timeframeHours,
    });
  };

  const handlePreset = (presetName: string, presetUrl: string, amount: string) => {
    setName(presetName);
    setRepoUrl(presetUrl);
    setPrizeAmount(amount);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto border border-metallic-800 shadow-glass">
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sage text-xs font-mono uppercase tracking-wider mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sage" />
          <span>Stage 01 // Repository Onboarding</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cream">
          Connect Hackathon Repository
        </h2>
        <p className="text-xs sm:text-sm text-metallic-400 mt-1">
          Specify the repository URL and hackathon window. The AI auditing engine will ingest commit diffs, filter boilerplate, and calculate fair splits.
        </p>
      </div>

      {/* Preset Quick-Picks */}
      <div className="mb-6">
        <div className="text-[11px] font-mono text-metallic-500 mb-2 flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-sage" />
          <span>QUICK TEST PRESETS:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handlePreset('Meta Hackathon Prize Winner', 'https://github.com/meta-hackathon/super-agent-ai', '10000')}
            className="text-left px-3 py-2 rounded-lg border border-metallic-800 hover:border-metallic-700 bg-metallic-900/40 text-xs font-mono hover:bg-metallic-900 transition-colors"
          >
            <div className="text-cream font-medium">Meta AI Agent (4 Devs)</div>
            <div className="text-metallic-500 text-[10px] truncate">$10,000 Pool // 36-Hr Window</div>
          </button>
          <button
            type="button"
            onClick={() => handlePreset('Supabase pgvector Engine', 'https://github.com/supabase/pgvector', '5000')}
            className="text-left px-3 py-2 rounded-lg border border-metallic-800 hover:border-metallic-700 bg-metallic-900/40 text-xs font-mono hover:bg-metallic-900 transition-colors"
          >
            <div className="text-cream font-medium">Vector Store System</div>
            <div className="text-metallic-500 text-[10px] truncate">$5,000 Pool // Open Source Grant</div>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-xs font-mono uppercase text-metallic-400 mb-1.5">
            Team / Project Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nexus AI Autonomous Agent"
            required
            className="w-full px-3.5 py-2.5 rounded-lg bg-metallic-900/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-sm font-sans placeholder-metallic-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase text-metallic-400 mb-1.5">
            GitHub Repository URL
          </label>
          <div className="relative">
            <GitPullRequest className="w-4 h-4 text-metallic-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-metallic-900/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-sm font-mono placeholder-metallic-600 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase text-metallic-400 mb-1.5">
              Prize Pool (USD)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-sage absolute left-3.5 top-3" />
              <input
                type="number"
                min="10"
                step="10"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value)}
                placeholder="10000"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-metallic-900/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-sm font-mono placeholder-metallic-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-metallic-400 mb-1.5">
              Hackathon Window ({timeframeHours} Hours)
            </label>
            <div className="flex items-center space-x-2 pt-1">
              <Clock className="w-4 h-4 text-metallic-500" />
              <input
                type="range"
                min="12"
                max="72"
                step="6"
                value={timeframeHours}
                onChange={(e) => setTimeframeHours(parseInt(e.target.value))}
                className="w-full accent-sage h-1.5 bg-metallic-800 rounded-lg cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-metallic-500 mt-1">
              <span>12h</span>
              <span className="text-sage font-bold">{timeframeHours}h</span>
              <span>72h</span>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-cream hover:bg-cream-dim text-metallic-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-glow-sage disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-metallic-950 border-t-transparent rounded-full animate-spin" />
                <span>INGESTING REPOSITORY...</span>
              </>
            ) : (
              <>
                <span>PROCEED TO WALLET LINKING</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
