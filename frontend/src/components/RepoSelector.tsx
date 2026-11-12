import React, { useState } from 'react';
import { 
  GitPullRequest, 
  Clock, 
  ArrowRight, 
  Trophy, 
  Users, 
  UserCheck, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ChevronDown, 
  Coins, 
  Globe 
} from 'lucide-react';
import { SupportedCurrency } from '../types';

interface MemberInputState {
  id: string;
  name: string;
  github_username: string;
}

interface RepoSelectorProps {
  onSubmit: (data: {
    name: string;
    hackathon_name: string;
    hackathon_duration: string;
    leader_name: string;
    leader_github_username: string;
    repo_url: string;
    total_prize_amount: number;
    currency: SupportedCurrency;
    timeframe_hours: number;
    initial_members: Array<{ name: string; github_username: string }>;
  }) => void;
  isLoading: boolean;
}

const CURRENCY_OPTIONS: Array<{ code: SupportedCurrency; symbol: string; label: string }> = [
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'AU$', label: 'Australian Dollar (AUD)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY)' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc (CHF)' },
];

export const RepoSelector: React.FC<RepoSelectorProps> = ({ onSubmit, isLoading }) => {
  // 1. Team & Hackathon Details
  const [teamName, setTeamName] = useState('');
  const [hackathonName, setHackathonName] = useState('');
  const [hackathonDuration, setHackathonDuration] = useState('36 Hours');

  // 2. Team Leader (Before GitHub Repo)
  const [leaderName, setLeaderName] = useState('');
  const [leaderGithub, setLeaderGithub] = useState('');

  // 3. GitHub Repository Link
  const [repoUrl, setRepoUrl] = useState('');

  // 4. Team Size & Member inputs (After GitHub Repo)
  const [members, setMembers] = useState<MemberInputState[]>([
    { id: '1', name: '', github_username: '' },
    { id: '2', name: '', github_username: '' },
    { id: '3', name: '', github_username: '' },
  ]);

  // 5. Total Prize Pool & Multi-Currency Selection
  const [totalPrizeAmount, setTotalPrizeAmount] = useState('10000');
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('USD');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  // Validation state
  const [urlError, setUrlError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const validateGitHubUrl = (url: string): boolean => {
    const trimmed = url.trim();
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

  // Adjust team size dynamically
  const handleTeamSizeChange = (newSize: number) => {
    const targetSize = Math.max(1, Math.min(10, newSize));
    if (targetSize > members.length) {
      const addedCount = targetSize - members.length;
      const newItems: MemberInputState[] = Array.from({ length: addedCount }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        name: '',
        github_username: '',
      }));
      setMembers([...members, ...newItems]);
    } else if (targetSize < members.length) {
      setMembers(members.slice(0, targetSize));
    }
  };

  const handleMemberChange = (id: string, field: 'name' | 'github_username', val: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  const handleAddMember = () => {
    if (members.length >= 10) return;
    setMembers((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', github_username: '' },
    ]);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanTeamName = teamName.trim();
    const cleanHackathonName = hackathonName.trim();
    const cleanDuration = hackathonDuration.trim();
    const cleanLeaderName = leaderName.trim();
    const cleanLeaderGithub = leaderGithub.trim().replace(/^@/, '');
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
    if (!cleanLeaderName) {
      setFormError('Please enter the Team Leader Name.');
      return;
    }
    if (!cleanLeaderGithub) {
      setFormError('Please enter the Team Leader GitHub User ID.');
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

    const validMembers = members
      .map((m) => ({
        name: m.name.trim(),
        github_username: m.github_username.trim().replace(/^@/, ''),
      }))
      .filter((m) => m.name || m.github_username);

    for (const vm of validMembers) {
      if (!vm.name || !vm.github_username) {
        setFormError('Please ensure all added members have both a Name and a GitHub User ID.');
        return;
      }
    }

    const match = cleanDuration.match(/\d+/);
    const parsedHours = match ? parseInt(match[0], 10) : 36;

    onSubmit({
      name: cleanTeamName,
      hackathon_name: cleanHackathonName,
      hackathon_duration: cleanDuration,
      leader_name: cleanLeaderName,
      leader_github_username: cleanLeaderGithub,
      repo_url: cleanUrl,
      total_prize_amount: parsedPrize,
      currency: selectedCurrency,
      timeframe_hours: parsedHours,
      initial_members: validMembers,
    });
  };

  const activeCurrencyInfo = CURRENCY_OPTIONS.find((c) => c.code === selectedCurrency) || CURRENCY_OPTIONS[0];

  return (
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-10 max-w-3xl mx-auto border border-metallic-700 bg-metallic-900/90 shadow-glass space-y-5 sm:space-y-6">
      
      {/* Stage Header */}
      <div>
        <div className="flex items-center space-x-2 text-sage text-xs font-mono uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
          <span>Stage 01 // Project & Squad Onboarding</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-cream">
          Connect Hackathon Project & Team
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

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        
        {/* Section 1: Hackathon & Team Identity */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Team Name */}
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
                  className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-metallic-950/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-xs sm:text-sm font-sans placeholder-metallic-600 transition-colors"
                />
              </div>
            </div>

            {/* Hackathon Name */}
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
                  className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-metallic-950/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-xs sm:text-sm font-sans placeholder-metallic-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Hackathon Duration */}
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
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-metallic-950/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-xs sm:text-sm font-sans placeholder-metallic-600 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Team Leader Details (BEFORE GitHub Repository) */}
        <div className="p-3.5 sm:p-5 rounded-2xl border border-sage/30 bg-sage/5 space-y-3">
          <div className="flex items-center space-x-2 text-sage text-xs font-mono uppercase tracking-wider font-bold">
            <UserCheck className="w-4 h-4 text-sage" />
            <span>Team Leader Credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-metallic-300 mb-1.5 font-bold">
                Leader Name <span className="text-sage">*</span>
              </label>
              <input
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-metallic-950/90 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-xs sm:text-sm font-sans placeholder-metallic-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-metallic-300 mb-1.5 font-bold">
                Leader GitHub User ID <span className="text-sage">*</span>
              </label>
              <div className="relative">
                <span className="text-metallic-500 absolute left-3.5 top-2.5 text-xs sm:text-sm font-mono">@</span>
                <input
                  type="text"
                  value={leaderGithub}
                  onChange={(e) => setLeaderGithub(e.target.value)}
                  placeholder="alex-rivera"
                  required
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-metallic-950/90 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-xs sm:text-sm font-mono placeholder-metallic-600 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: GitHub Repository Link (with strict URL validation) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-mono uppercase text-metallic-300 font-bold">
              GitHub Repository Link <span className="text-sage">*</span>
            </label>
            <span className="text-[9px] sm:text-[10px] font-mono text-metallic-500">Valid URL required</span>
          </div>
          <div className="relative">
            <GitPullRequest className="w-4 h-4 text-metallic-500 absolute left-3.5 top-3.5" />
            <input
              type="url"
              value={repoUrl}
              onChange={handleUrlChange}
              placeholder="https://github.com/owner/repository"
              required
              className={`w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-metallic-950/80 border text-cream text-xs sm:text-sm font-mono placeholder-metallic-600 transition-colors focus:outline-none ${
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

        {/* Section 4: Team Size & Members (AFTER GitHub Repository) */}
        <div className="p-3.5 sm:p-5 rounded-2xl border border-metallic-800 bg-metallic-950/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-metallic-800">
            <div>
              <div className="flex items-center space-x-2 text-cream text-xs font-mono uppercase tracking-wider font-bold">
                <Users className="w-4 h-4 text-sage" />
                <span>Team Members ({members.length})</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-metallic-400 font-mono mt-0.5">
                Teammates participating in the prize distribution.
              </p>
            </div>

            {/* Team Size Selector */}
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="text-xs font-mono text-metallic-400">Team Size:</span>
              <div className="flex items-center rounded-xl border border-metallic-800 bg-metallic-900 p-0.5 font-mono text-xs">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleTeamSizeChange(num)}
                    className={`px-2 py-1 rounded-lg transition-colors text-xs ${
                      members.length === num
                        ? 'bg-sage text-metallic-950 font-bold'
                        : 'text-metallic-400 hover:text-cream'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Member Input Rows */}
          <div className="space-y-2.5">
            {members.map((member, index) => (
              <div
                key={member.id}
                className="p-2.5 sm:p-3 rounded-xl border border-metallic-800/80 bg-metallic-900/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between sm:justify-start sm:w-12 text-metallic-500 font-bold">
                  <span>#{index + 1}</span>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="sm:hidden p-1 rounded-lg text-metallic-500 hover:text-signal-red"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                    placeholder="Member Name (e.g. Sarah Chen)"
                    className="w-full px-3 py-2 rounded-lg bg-metallic-950/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-xs font-sans placeholder-metallic-600"
                  />
                </div>

                <div className="flex-1 relative">
                  <span className="text-metallic-500 absolute left-2.5 top-2 text-xs font-mono">@</span>
                  <input
                    type="text"
                    value={member.github_username}
                    onChange={(e) => handleMemberChange(member.id, 'github_username', e.target.value)}
                    placeholder="GitHub User ID (e.g. sarah-ui)"
                    className="w-full pl-6 pr-3 py-2 rounded-lg bg-metallic-950/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-xs font-mono placeholder-metallic-600"
                  />
                </div>

                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="hidden sm:block p-2 rounded-lg text-metallic-500 hover:text-signal-red hover:bg-signal-red/10 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {members.length < 10 && (
            <button
              type="button"
              onClick={handleAddMember}
              className="w-full py-2.5 rounded-xl border border-dashed border-metallic-700 hover:border-sage text-metallic-400 hover:text-sage text-xs font-mono flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Team Member</span>
            </button>
          )}
        </div>

        {/* Section 5: Total Prize Pool with Dropdown Option & Multi-Currency Suggestions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-mono uppercase text-metallic-300 font-bold">
              Total Prize Pool Amount <span className="text-sage">*</span>
            </label>
            <span className="text-[9px] sm:text-[10px] font-mono text-metallic-500 flex items-center space-x-1">
              <Globe className="w-3 h-3 text-sage" />
              <span>Multi-Currency</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Amount input */}
            <div className="relative flex-1">
              <span className="w-4 h-4 text-sage absolute left-3.5 top-3 sm:top-3.5 font-bold font-mono text-sm">
                {activeCurrencyInfo.symbol}
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={totalPrizeAmount}
                onChange={(e) => setTotalPrizeAmount(e.target.value)}
                placeholder="10000"
                required
                className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl bg-metallic-950/80 border border-metallic-800 focus:border-sage focus:outline-none text-cream text-xs sm:text-sm font-mono placeholder-metallic-600 transition-colors"
              />
            </div>

            {/* Currency Dropdown Selector */}
            <div className="relative sm:w-56">
              <button
                type="button"
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                className="w-full py-2.5 sm:py-3 px-3.5 rounded-xl bg-metallic-950/80 border border-metallic-800 hover:border-sage text-cream text-xs font-mono flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-sage font-bold">{activeCurrencyInfo.symbol}</span>
                  <span className="font-bold">{activeCurrencyInfo.code}</span>
                  <span className="text-metallic-400 text-[10px] truncate">({activeCurrencyInfo.label.split(' ')[0]})</span>
                </div>
                <ChevronDown className="w-4 h-4 text-metallic-400 shrink-0 ml-1" />
              </button>

              {/* Currency Dropdown Menu (Adaptive positioning for Mobile) */}
              {isCurrencyDropdownOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-full sm:w-64 max-h-60 overflow-y-auto rounded-xl border border-metallic-700 bg-metallic-900 shadow-2xl z-20 py-1 divide-y divide-metallic-800 font-mono text-xs">
                  {CURRENCY_OPTIONS.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCurrency(c.code);
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-metallic-800/80 transition-colors ${
                        selectedCurrency === c.code ? 'bg-sage/10 text-sage font-bold' : 'text-metallic-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sage font-bold w-6 text-center">{c.symbol}</span>
                        <span>{c.code}</span>
                      </div>
                      <span className="text-[10px] text-metallic-500">{c.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Currency Suggestion Chips */}
          <div className="flex items-center space-x-1.5 pt-1 flex-wrap gap-y-1">
            <span className="text-[10px] font-mono text-metallic-500 mr-1 flex items-center space-x-1">
              <Coins className="w-3 h-3 text-sage" />
              <span>Quick:</span>
            </span>
            {(['USD', 'INR', 'EUR', 'GBP'] as SupportedCurrency[]).map((cur) => {
              const opt = CURRENCY_OPTIONS.find((c) => c.code === cur)!;
              return (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setSelectedCurrency(cur)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                    selectedCurrency === cur
                      ? 'bg-sage text-metallic-950 font-bold shadow-glow-sm'
                      : 'border border-metallic-800 bg-metallic-950/60 text-metallic-400 hover:text-cream hover:border-metallic-700'
                  }`}
                >
                  {opt.symbol} {cur}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2 sm:pt-3">
          <button
            type="submit"
            disabled={isLoading || Boolean(urlError)}
            className="w-full py-3.5 sm:py-4 rounded-xl bg-sage text-metallic-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-glow hover:bg-cream disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-metallic-950 border-t-transparent rounded-full animate-spin" />
                <span>CONNECTING REPOSITORY & SQUAD...</span>
              </>
            ) : (
              <>
                <span>PROCEED TO SQUAD & AI AUDIT</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
