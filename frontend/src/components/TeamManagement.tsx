import React, { useState } from 'react';
import { Team, TeamMember } from '../types';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Trash2, 
  ShieldCheck, 
  Check, 
  X, 
  ChevronRight,
  Globe
} from 'lucide-react';

interface TeamManagementProps {
  team: Team;
  onInviteMember: (data: {
    name: string;
    email?: string;
    github_username: string;
    role?: string;
    country?: string;
    is_eligible?: boolean;
  }) => Promise<void>;
  onToggleEligibility: (memberId: string, isEligible: boolean) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onProceedToAudit: () => void;
  isAudited: boolean;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  team,
  onInviteMember,
  onToggleEligibility,
  onRemoveMember,
  onProceedToAudit,
  isAudited,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteGithub, setInviteGithub] = useState('');
  const [inviteRole, setInviteRole] = useState('Core Contributor');
  const [inviteCountry, setInviteCountry] = useState('US');
  const [inviteEligible, setInviteEligible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eligibleMembers = team.members.filter((m) => m.is_eligible);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteGithub.trim()) return;
    setIsSubmitting(true);
    try {
      await onInviteMember({
        name: inviteName.trim(),
        email: inviteEmail.trim() || undefined,
        github_username: inviteGithub.trim().replace(/^@/, ''),
        role: inviteRole,
        country: inviteCountry,
        is_eligible: inviteEligible,
      });
      setInviteName('');
      setInviteEmail('');
      setInviteGithub('');
      setShowInviteModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-metallic-800 shadow-glass space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-metallic-800">
        <div>
          <div className="flex items-center space-x-2 text-sage text-xs font-mono uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sage" />
            <span>Section A // Team Management & Distribution Eligibility</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cream">
            Registered Squad Members
          </h2>
          <p className="text-xs sm:text-sm text-metallic-400 mt-1">
            Manage contributors, invite new teammates, and choose who participates in prize distribution.
          </p>
        </div>

        {team.status !== 'paid' && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-xl bg-metallic-900 border border-metallic-700 hover:border-cream/40 text-cream text-xs font-mono transition-colors flex items-center space-x-2 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4 text-sage" />
            <span>+ INVITE MEMBER</span>
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {team.members.map((member) => {
          return (
            <div
              key={member.id}
              className={`p-4 rounded-xl border transition-all ${
                member.is_eligible
                  ? 'bg-metallic-900/60 border-metallic-800 hover:border-metallic-700'
                  : 'bg-metallic-950/40 border-metallic-900 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                
                {/* Avatar & Info */}
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-xs uppercase shrink-0 ${
                      member.is_leader
                        ? 'border-sage/40 bg-sage/10 text-sage'
                        : 'border-metallic-700 bg-metallic-850 text-cream'
                    }`}
                  >
                    {member.github_username.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-cream font-mono">
                        {member.name}
                      </span>
                      {member.is_leader && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sage/20 text-sage font-medium">
                          LEADER
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-metallic-400 flex items-center space-x-1.5 mt-0.5">
                      <span>@{member.github_username}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Globe className="w-3 h-3 text-metallic-500" />
                        <span>{member.country}</span>
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-metallic-500 mt-0.5">
                      {member.role}
                    </div>
                  </div>
                </div>

                {/* Eligibility Toggle & Actions */}
                <div className="flex items-center space-x-2">
                  {team.status !== 'paid' && (
                    <>
                      <button
                        onClick={() => onToggleEligibility(member.id, !member.is_eligible)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-colors ${
                          member.is_eligible
                            ? 'bg-signal-green/10 border border-signal-green/30 text-signal-green hover:bg-signal-green/20'
                            : 'bg-metallic-800 border border-metallic-700 text-metallic-400 hover:text-cream'
                        }`}
                        title={member.is_eligible ? 'Eligible for prize' : 'Excluded from prize'}
                      >
                        {member.is_eligible ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Included</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Excluded</span>
                          </>
                        )}
                      </button>

                      {!member.is_leader && (
                        <button
                          onClick={() => onRemoveMember(member.id)}
                          className="p-1.5 rounded-lg border border-metallic-800 hover:border-signal-red/40 text-metallic-500 hover:text-signal-red transition-colors"
                          title="Remove from team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation CTA */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-metallic-850">
        <div className="text-xs font-mono text-metallic-400">
          <strong className="text-cream">{eligibleMembers.length}</strong> eligible participants selected for prize money.
        </div>

        <button
          onClick={onProceedToAudit}
          disabled={eligibleMembers.length === 0}
          className="px-6 py-3 rounded-xl bg-cream hover:bg-cream-dim text-metallic-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-glow-sage disabled:opacity-40"
        >
          <span>{isAudited ? 'RE-RUN AI CONTRIBUTION AUDIT' : 'PROCEED TO AI CONTRIBUTION AUDIT'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-metallic-950/85 backdrop-blur-md">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-md border border-metallic-700 shadow-glass space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-metallic-800">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-sage" />
                <h3 className="font-mono font-bold text-cream text-base">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-metallic-400 hover:text-cream"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-metallic-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-metallic-900 border border-metallic-800 text-cream text-xs font-sans focus:outline-none focus:border-sage"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-metallic-400 mb-1">GitHub Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. priya-dev"
                  value={inviteGithub}
                  onChange={(e) => setInviteGithub(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-metallic-900 border border-metallic-800 text-cream text-xs font-mono focus:outline-none focus:border-sage"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-metallic-400 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="priya@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-metallic-900 border border-metallic-800 text-cream text-xs font-sans focus:outline-none focus:border-sage"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-metallic-400 mb-1">Role</label>
                  <input
                    type="text"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-metallic-900 border border-metallic-800 text-cream text-xs font-sans focus:outline-none focus:border-sage"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-metallic-400 mb-1">Country</label>
                  <select
                    value={inviteCountry}
                    onChange={(e) => setInviteCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-metallic-900 border border-metallic-800 text-cream text-xs font-mono focus:outline-none focus:border-sage"
                  >
                    <option value="IN">India (IN)</option>
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="AU">Australia (AU)</option>
                    <option value="SG">Singapore (SG)</option>
                    <option value="AE">UAE (AE)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="eligibleCheck"
                  checked={inviteEligible}
                  onChange={(e) => setInviteEligible(e.target.checked)}
                  className="w-4 h-4 accent-sage rounded"
                />
                <label htmlFor="eligibleCheck" className="text-xs font-mono text-metallic-300">
                  Include in prize money distribution
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-cream hover:bg-cream-dim text-metallic-950 font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'INVITING...' : 'CONFIRM INVITATION'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
