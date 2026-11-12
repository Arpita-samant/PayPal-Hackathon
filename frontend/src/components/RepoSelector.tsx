import React, { useState } from 'react';
import { GitPullRequest, Clock, DollarSign, ArrowRight, Trophy, Users, AlertCircle } from 'lucide-react';

interface RepoSelectorProps {
  onSubmit: (data: {
    name: string;
    hackathon_name: string;
    hackathon_duration: string;
    repo_url: string;
    total_prize_amount: number;
    timeframe_hours: number;
  }) => void;
  isLoading: boolean;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({ onSubmit, isLoading }) => {
  const [teamName, setTeamName] = useState('');
  const [hackathonName, setHackathonName] = useState('');
  const [hackathonDuration, setHackathonDuration] = useState('36 Hours');
  const [repoUrl, setRepoUrl] = useState('');
  const [totalPrizeAmount, setTotalPrizeAmount] = useState('10000');
  
  // Validation state
  const [urlError, setUrlError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const validateGitHubUrl = (url: string): boolean => {
    const trimmed = url.trim();
    // Valid format: https://github.com/:owner/:repo (with optional .git or trailing slash)
    const githubRepoRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?\/?$/;
    return githubRepoRegex.test(trimmed);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRepoUrl(val);
    if (val.trim() && !validateGitHubUrl(val)) {
      setUrlError('Must be a valid GitHub repository URL (e.g. https://github.com/owner/repo)');
    } else {
      setUrlError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanTeamName = teamName.trim();
    const cleanHackathonName = hackathonName.trim();
    const cleanDuration = hackathonDuration.trim();
    const cleanUrl = repoUrl.trim();
    const parsedPrize = parseFloat(totalPrizeAmount);

    if (!cleanTeamName) {
      setFormError('Please enter your Team Name.');
      return;
    }
    if (!cleanHackathonName) {
      setFormError('Please enter the Hackathon Name.');
      return;
    }
    if (!cleanDuration) {
      setFormError('Please specify the Hackathon Duration.');
      return;
    }
    if (!cleanUrl || !validateGitHubUrl(cleanUrl)) {
      setUrlError('Please enter a valid GitHub repository link (e.g. https://github.com/owner/repo)');
      return;
    }
    if (isNaN(parsedPrize) || parsedPrize <= 0) {
      setFormError('Please enter a valid Total Prize Pool Amount.');
      return;
    }

    // Extract timeframe hours from duration string (e.g., "36 Hours" -> 36, default 36)
    const match = cleanDuration.match(/\d+/);
    const parsedHours = match ? parseInt(match[0], 10) : 36;

    onSubmit({
      name: cleanTeamName,
      hackathon_name: cleanHackathonName,
      hackathon_duration: cleanDuration,
      repo_url: cleanUrl,
      total_prize_amount: parsedPrize,
      timeframe_hours: parsedHours,
    });
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-10 max-w-2xl mx-auto border border-metallic-700 bg-metallic-900/90 shadow-glass space-y-6">
      
      {/* Stage Header */}
      <div>
        <div className="flex items-center space-x-2 text-sage text-xs font-mono uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
          <span>Stage 01 // Project Onboarding</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-cream">
          Connect Hackathon Project
        </h2>
        <p className="text-xs sm:text-sm text-metallic-400 mt-1">
          Provide your team and hackathon details to initiate autonomous AI contribution audits and PayPal prize splitting.
        </p>
      </div>

      {formError && (
        <div className="p-3.5 rounded-xl border border-signal-red/30 bg-signal-red/10 text-signal-red text-xs font-mono flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form with strictly the 5 requested inputs */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* 1. Team Name */}
        <div>
          <label className="block text-xs font-mono uppercase text-metallic-300 mb-1.5 font-bold">
            Team Name <span className="text-sage">*</span>
          </label>
          <div className="relative">
            <Users className="w-4 h-4 text-metallic-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Nexus AI Autonomous Agent"
              required
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-metallic-950/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-sm font-sans placeholder-metallic-600 transition-colors"
            />
          </div>
        </div>

        {/* 2. Hackathon Name */}
        <div>
          <label className="block text-xs font-mono uppercase text-metallic-300 mb-1.5 font-bold">
            Hackathon Name <span className="text-sage">*</span>
          </label>
          <div className="relative">
            <Trophy className="w-4 h-4 text-metallic-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={hackathonName}
              onChange={(e) => setHackathonName(e.target.value)}
              placeholder="e.g. PayPal Global Hackathon 2026"
              required
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-metallic-950/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-sm font-sans placeholder-metallic-600 transition-colors"
            />
          </div>
        </div>

        {/* 3. Hackathon Duration */}
        <div>
          <label className="block text-xs font-mono uppercase text-metallic-300 mb-1.5 font-bold">
            Hackathon Duration <span className="text-sage">*</span>
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-metallic-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={hackathonDuration}
              onChange={(e) => setHackathonDuration(e.target.value)}
              placeholder="e.g. 36 Hours, 48 Hours, or 3 Days"
              required
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-metallic-950/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-sm font-sans placeholder-metallic-600 transition-colors"
            />
          </div>
        </div>

        {/* 4. GitHub Repository Link (with URL validation) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-mono uppercase text-metallic-300 font-bold">
              GitHub Repository Link <span className="text-sage">*</span>
            </label>
            <span className="text-[10px] font-mono text-metallic-500">Must be a valid GitHub repo URL</span>
          </div>
          <div className="relative">
            <GitPullRequest className="w-4 h-4 text-metallic-500 absolute left-3.5 top-3.5" />
            <input
              type="url"
              value={repoUrl}
              onChange={handleUrlChange}
              placeholder="https://github.com/owner/repository"
              required
              className={`w-full pl-10 pr-3.5 py-3 rounded-xl bg-metallic-950/80 border text-cream text-sm font-mono placeholder-metallic-600 transition-colors focus:outline-none ${
                urlError ? 'border-signal-red focus:border-signal-red' : 'border-metallic-800 focus:border-sage'
              }`}
            />
          </div>
          {urlError && (
            <p className="text-[11px] font-mono text-signal-red mt-1 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{urlError}</span>
            </p>
          )}
        </div>

        {/* 5. Total Prize Pool Amount */}
        <div>
          <label className="block text-xs font-mono uppercase text-metallic-300 mb-1.5 font-bold">
            Total Prize Pool Amount (USD) <span className="text-sage">*</span>
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-sage absolute left-3.5 top-3.5" />
            <input
              type="number"
              min="1"
              step="any"
              value={totalPrizeAmount}
              onChange={(e) => setTotalPrizeAmount(e.target.value)}
              placeholder="10000"
              required
              className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-metallic-950/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-sm font-mono placeholder-metallic-600 transition-colors"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || Boolean(urlError)}
            className="w-full py-3.5 rounded-xl bg-sage text-metallic-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-glow hover:bg-cream disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-metallic-950 border-t-transparent rounded-full animate-spin" />
                <span>CONNECTING REPOSITORY...</span>
              </>
            ) : (
              <>
                <span>PROCEED TO SQUAD & ELIGIBILITY</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
