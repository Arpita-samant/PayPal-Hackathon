import React, { useState } from 'react';
import { TeamMember } from '../types';
import { Mail, CheckCircle2, AlertCircle, Play, Shield, Edit2, Check } from 'lucide-react';

interface WalletLinkingProps {
  members: TeamMember[];
  onUpdateMember: (memberId: string, paypalEmail: string) => Promise<void>;
  onStartAudit: () => void;
  isAuditing: boolean;
  totalPrize: number;
  currency: string;
}

export const WalletLinking: React.FC<WalletLinkingProps> = ({
  members,
  onUpdateMember,
  onStartAudit,
  isAuditing,
  totalPrize,
  currency,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setTempEmail(member.paypal_email || '');
  };

  const saveEdit = async (memberId: string) => {
    setIsSaving(true);
    try {
      await onUpdateMember(memberId, tempEmail);
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const allWalletsValid = members.length > 0 && members.every((m) => m.paypal_email && m.paypal_email.includes('@'));

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto border border-metallic-800 shadow-glass">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-metallic-800">
        <div>
          <div className="flex items-center space-x-2 text-sage text-xs font-mono uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sage" />
            <span>Stage 02 // Contributor Wallet Linking</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cream">
            PayPal Digital Wallets
          </h2>
          <p className="text-xs sm:text-sm text-metallic-400 mt-1">
            Map each GitHub committer to their verified PayPal recipient email for batched prize disbursement.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-metallic-900 border border-metallic-800 flex items-center space-x-3 self-start sm:self-auto">
          <div className="text-right font-mono">
            <div className="text-[10px] text-metallic-500 uppercase">Prize Pool</div>
            <div className="text-sm font-bold text-cream">
              {currency} {totalPrize.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="space-y-3 mb-6">
        {members.map((member) => {
          const isEditing = editingId === member.id;
          const hasWallet = member.paypal_email && member.paypal_email.includes('@');

          return (
            <div
              key={member.id}
              className="p-4 rounded-xl border border-metallic-800/80 bg-metallic-900/40 hover:bg-metallic-900/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Member Meta */}
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-lg border border-metallic-700 bg-metallic-850 flex items-center justify-center font-mono font-bold text-xs text-cream uppercase">
                  {member.github_username.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-semibold text-cream">
                      @{member.github_username}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-metallic-700 text-metallic-400 bg-metallic-800">
                      {member.role}
                    </span>
                  </div>
                  <div className="text-xs text-metallic-500 font-mono flex items-center space-x-1.5 mt-0.5">
                    {hasWallet ? (
                      <span className="text-signal-green flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Wallet Ready</span>
                      </span>
                    ) : (
                      <span className="text-signal-orange flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>PayPal Required</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PayPal Input / Display */}
              <div className="flex items-center space-x-2 w-full md:w-auto">
                {isEditing ? (
                  <div className="flex items-center space-x-2 w-full md:w-72">
                    <input
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      placeholder="paypal.recipient@email.com"
                      className="w-full px-3 py-1.5 rounded-lg bg-metallic-950 border border-sage text-cream text-xs font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => saveEdit(member.id)}
                      className="p-2 rounded-lg bg-sage text-metallic-950 hover:bg-sage-glow transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between md:justify-end space-x-3 w-full md:w-auto">
                    <span className="text-xs font-mono text-metallic-300">
                      {member.paypal_email || 'No wallet linked'}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(member)}
                      className="p-1.5 rounded-md border border-metallic-800 hover:border-metallic-700 text-metallic-400 hover:text-cream transition-colors"
                      title="Edit PayPal email"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Audit CTA */}
      <div className="pt-2">
        <button
          onClick={onStartAudit}
          disabled={isAuditing || !allWalletsValid}
          className="w-full py-3.5 rounded-xl bg-cream hover:bg-cream-dim text-metallic-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-glow-sage disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAuditing ? (
            <>
              <span className="w-4 h-4 border-2 border-metallic-950 border-t-transparent rounded-full animate-spin" />
              <span>RUNNING AI CONTEXTUAL FAIRNESS ENGINE...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>START AI AUDIT & GENERATE FAIRNESS REPORT</span>
            </>
          )}
        </button>

        {!allWalletsValid && (
          <p className="text-center text-[11px] font-mono text-signal-orange mt-2">
            * Please configure valid PayPal emails for all contributors before running the audit.
          </p>
        )}
      </div>

    </div>
  );
};
