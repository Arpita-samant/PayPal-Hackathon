import React, { useState } from 'react';
import { Team, TeamMember } from '../types';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Trash2, 
  Check, 
  X, 
  ChevronRight,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle
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
    paypal_email?: string;
  }) => Promise<void>;
  onToggleEligibility: (memberId: string, isEligible: boolean) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onUpdateMemberPaypal: (memberId: string, paypalEmail: string) => Promise<void>;
  onProceedToAudit: () => void;
  isAudited: boolean;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  team,
  onInviteMember,
  onToggleEligibility,
  onRemoveMember,
  onUpdateMemberPaypal,
  onProceedToAudit,
  isAudited,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteGithub, setInviteGithub] = useState('');
  const [invitePaypalEmail, setInvitePaypalEmail] = useState('');
  const [inviteEligible, setInviteEligible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local state for editing PayPal emails inline for each member
  const [paypalEmails, setPaypalEmails] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    team.members.forEach((m) => {
      initial[m.id] = m.paypal_email || m.payment_account_value || m.email || '';
    });
    return initial;
  });

  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<{ id: string; message: string } | null>(null);

  const eligibleMembers = team.members.filter((m) => m.is_eligible);

  const handlePaypalEmailChange = (memberId: string, val: string) => {
    setPaypalEmails((prev) => ({ ...prev, [memberId]: val }));
    if (saveError?.id === memberId) setSaveError(null);
  };

  const handleSavePaypalEmail = async (memberId: string) => {
    const emailToSave = (paypalEmails[memberId] || '').trim();
    if (!emailToSave) {
      setSaveError({ id: memberId, message: 'Please enter a valid PayPal email.' });
      return;
    }
    setSavingMemberId(memberId);
    setSaveError(null);
    try {
      await onUpdateMemberPaypal(memberId, emailToSave);
      setSavedSuccessId(memberId);
      setTimeout(() => setSavedSuccessId(null), 2500);
    } catch (err: any) {
      setSaveError({ id: memberId, message: err.message || 'Failed to save PayPal email.' });
    } finally {
      setSavingMemberId(null);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteGithub.trim() || !invitePaypalEmail.trim()) return;
    setIsSubmitting(true);
    try {
      await onInviteMember({
        name: inviteName.trim(),
        github_username: inviteGithub.trim().replace(/^@/, ''),
        paypal_email: invitePaypalEmail.trim(),
        email: invitePaypalEmail.trim(),
        role: 'Core Contributor',
        country: 'US',
        is_eligible: inviteEligible,
      });
      setInviteName('');
      setInviteGithub('');
      setInvitePaypalEmail('');
      setShowInviteModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-metallic-700 bg-metallic-900/90 shadow-glass space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-metallic-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cream flex items-center space-x-2">
            <Users className="w-5 h-5 text-sage" />
            <span>Squad & PayPal Payout Accounts</span>
          </h2>
          <p className="text-xs sm:text-sm text-metallic-400 mt-1">
            Provide PayPal developer emails for each teammate to ensure prize money can be disbursed via PayPal Payouts.
          </p>
        </div>

        {team.status !== 'paid' && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-xl bg-metallic-900 border border-metallic-700 hover:border-sage text-cream text-xs font-mono transition-colors flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-sage" />
            <span>+ INVITE MEMBER</span>
          </button>
        )}
      </div>

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.members.map((member) => {
          const currentInputEmail = paypalEmails[member.id] ?? (member.paypal_email || member.payment_account_value || member.email || '');
          const originalEmail = member.paypal_email || member.payment_account_value || member.email || '';
          const hasEmailChanged = currentInputEmail.trim() !== originalEmail.trim();

          return (
            <div
              key={member.id}
              className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                member.is_eligible
                  ? 'bg-metallic-950/60 border-metallic-800 hover:border-metallic-700'
                  : 'bg-metallic-950/30 border-metallic-900 opacity-60'
              }`}
            >
              {/* Member Top Line: Avatar, Name, Handle, Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-xs uppercase shrink-0 ${
                      member.is_leader
                        ? 'border-sage/40 bg-sage/10 text-sage'
                        : 'border-metallic-700 bg-metallic-850 text-cream'
                    }`}
                  >
                    {member.github_username.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-cream font-mono truncate">
                        {member.name}
                      </span>
                      {member.is_leader && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sage/20 text-sage font-medium shrink-0">
                          LEADER
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-metallic-400 mt-0.5 truncate">
                      @{member.github_username}
                    </div>
                  </div>
                </div>

                {/* Eligibility Toggle & Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {team.status !== 'paid' && (
                    <>
                      <button
                        onClick={() => onToggleEligibility(member.id, !member.is_eligible)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer ${
                          member.is_eligible
                            ? 'bg-signal-green/10 border border-signal-green/30 text-signal-green hover:bg-signal-green/20'
                            : 'bg-metallic-800 border border-metallic-700 text-metallic-400 hover:text-cream'
                        }`}
                        title={member.is_eligible ? 'Participating in prize split' : 'Excluded from prize split'}
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
                          className="p-1.5 rounded-lg border border-metallic-800 hover:border-signal-red/40 text-metallic-500 hover:text-signal-red transition-colors cursor-pointer"
                          title="Remove from team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* PayPal Developer Email Input & Save Row */}
              <div className="pt-2 border-t border-metallic-850/80">
                <label className="block text-[11px] font-mono uppercase text-metallic-400 mb-1.5 font-medium flex items-center justify-between">
                  <span className="flex items-center space-x-1 text-sage">
                    <Mail className="w-3.5 h-3.5" />
                    <span>PayPal Developer Email:</span>
                  </span>
                  {savedSuccessId === member.id && (
                    <span className="text-[10px] text-signal-green flex items-center space-x-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Saved!</span>
                    </span>
                  )}
                </label>

                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    value={currentInputEmail}
                    onChange={(e) => handlePaypalEmailChange(member.id, e.target.value)}
                    placeholder="e.g. member@sandbox.paypal.com"
                    disabled={team.status === 'paid'}
                    className="flex-1 px-3 py-2 rounded-xl bg-metallic-900 border border-metallic-800 text-cream text-xs font-mono placeholder-metallic-600 focus:outline-none focus:border-sage transition-colors"
                  />

                  {team.status !== 'paid' && (
                    <button
                      type="button"
                      onClick={() => handleSavePaypalEmail(member.id)}
                      disabled={savingMemberId === member.id || (!hasEmailChanged && Boolean(originalEmail))}
                      className={`px-3 py-2 rounded-xl font-mono text-xs font-bold flex items-center space-x-1 transition-all ${
                        hasEmailChanged || !originalEmail
                          ? 'bg-sage text-metallic-950 hover:bg-cream shadow-glow-sm cursor-pointer'
                          : 'bg-metallic-850 text-metallic-500 border border-metallic-800 cursor-not-allowed opacity-60'
                      }`}
                      title="Save PayPal Email"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingMemberId === member.id ? 'Saving...' : 'Save'}</span>
                    </button>
                  )}
                </div>

                {saveError?.id === member.id && (
                  <p className="text-[11px] font-mono text-signal-red mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{saveError.message}</span>
                  </p>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Footer Navigation CTA */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-metallic-800">
        <div className="text-xs font-mono text-metallic-400">
          <strong className="text-cream">{eligibleMembers.length}</strong> of {team.members.length} team members eligible for prize disbursement.
        </div>

        <button
          onClick={onProceedToAudit}
          disabled={eligibleMembers.length === 0}
          className="px-6 py-3 rounded-xl bg-sage hover:bg-cream text-metallic-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-glow cursor-pointer disabled:opacity-40"
        >
          <span>{isAudited ? 'RE-RUN AI CONTRIBUTION AUDIT' : 'PROCEED TO AI CONTRIBUTION AUDIT'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-metallic-950/85 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 w-full max-w-md border border-metallic-700 bg-metallic-900 shadow-glass space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-metallic-800">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-sage" />
                <h3 className="font-mono font-bold text-cream text-base">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-metallic-400 hover:text-cream p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-metallic-300 mb-1 font-bold">
                  Member Full Name <span className="text-sage">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-metallic-950 border border-metallic-800 text-cream text-xs font-sans focus:outline-none focus:border-sage"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-metallic-300 mb-1 font-bold">
                  GitHub User ID <span className="text-sage">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. priya-dev"
                  value={inviteGithub}
                  onChange={(e) => setInviteGithub(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-metallic-950 border border-metallic-800 text-cream text-xs font-mono focus:outline-none focus:border-sage"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-metallic-300 mb-1 font-bold">
                  PayPal Developer Email <span className="text-sage">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya@sandbox.paypal.com"
                  value={invitePaypalEmail}
                  onChange={(e) => setInvitePaypalEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-metallic-950 border border-metallic-800 text-cream text-xs font-mono focus:outline-none focus:border-sage"
                />
                <p className="text-[10px] font-mono text-metallic-500 mt-1">
                  Required to disburse prize money directly to this member via PayPal.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="eligibleCheck"
                  checked={inviteEligible}
                  onChange={(e) => setInviteEligible(e.target.checked)}
                  className="w-4 h-4 accent-sage rounded cursor-pointer"
                />
                <label htmlFor="eligibleCheck" className="text-xs font-mono text-metallic-300 cursor-pointer select-none">
                  Include in prize money distribution
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-sage hover:bg-cream text-metallic-950 font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-glow"
                >
                  {isSubmitting ? 'INVITING...' : 'CONFIRM INVITATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
