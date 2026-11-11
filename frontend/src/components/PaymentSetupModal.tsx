import React, { useState, useEffect } from 'react';
import { Team, PaymentProviderInfo, TeamMember } from '../types';
import { 
  CreditCard, 
  ShieldCheck, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Key,
  Lock,
  Edit2,
  Check
} from 'lucide-react';

interface PaymentSetupModalProps {
  team: Team;
  providers: PaymentProviderInfo[];
  onAuthorizeProvider: (provider: string, accountReference: string) => Promise<void>;
  onUpdateRecipientAccount: (memberId: string, accountType: string, accountValue: string, country: string) => Promise<void>;
  onProceedToConfirmation: () => void;
}

export const PaymentSetupModal: React.FC<PaymentSetupModalProps> = ({
  team,
  providers,
  onAuthorizeProvider,
  onUpdateRecipientAccount,
  onProceedToConfirmation,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>(team.payment_provider || 'paypal');
  const [accountRef, setAccountRef] = useState(team.leader_email || 'merchant@hackathon.org');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  
  // Recipient accounts editing
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [tempAccountVal, setTempAccountVal] = useState('');
  const [tempCountry, setTempCountry] = useState('US');
  const [isSavingAcct, setIsSavingAcct] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeProvider = providers.find((p) => p.provider_id === selectedProvider) || providers[0];
  const eligibleMembers = team.members.filter((m) => m.is_eligible);

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    setErrorMsg(null);
    try {
      await onAuthorizeProvider(selectedProvider, accountRef);
    } catch (err: any) {
      setErrorMsg(err.message || 'Provider authorization failed.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const startEditAccount = (m: TeamMember) => {
    setEditingMemberId(m.id);
    setTempAccountVal(m.payment_account_value || '');
    setTempCountry(m.country || 'US');
    setErrorMsg(null);
  };

  const saveRecipientAccount = async (memberId: string) => {
    if (!tempAccountVal.trim()) return;
    setIsSavingAcct(true);
    setErrorMsg(null);
    try {
      await onUpdateRecipientAccount(
        memberId,
        activeProvider?.provider_id === 'upi_razorpay' ? 'upi_id' : activeProvider?.provider_id === 'stripe_transfer' ? 'iban' : activeProvider?.provider_id === 'wise' ? 'wise_email' : 'paypal_email',
        tempAccountVal.trim(),
        tempCountry
      );
      setEditingMemberId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid account details.');
    } finally {
      setIsSavingAcct(false);
    }
  };

  // Check if all recipients have valid receiving accounts
  const allAccountsReady = eligibleMembers.length > 0 && eligibleMembers.every((m) => Boolean(m.payment_account_value && m.account_verified));

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-metallic-800 shadow-glass space-y-6">
      
      {/* Header */}
      <div className="pb-4 border-b border-metallic-800">
        <div className="flex items-center space-x-2 text-sage text-xs font-mono uppercase tracking-wider mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sage" />
          <span>Section F // Secure Payment Account Connection</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cream">
          Connect Global Payment Rail
        </h2>
        <p className="text-xs sm:text-sm text-metallic-400 mt-1">
          Select a payment provider matching your currency ({team.currency}). Leader authorizes payout source; recipients provide validated destination accounts.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-signal-red/30 bg-signal-red/10 text-signal-red text-xs font-mono flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Payment Provider Selection (PayPal, UPI / Razorpay, Stripe, Wise) */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-metallic-400 uppercase tracking-wider">
          Step 1: Select Eligible Disbursement Provider ({team.currency})
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {providers.map((p) => {
            const isSupported = p.supported_currencies.includes(team.currency);
            const isSelected = selectedProvider === p.provider_id;

            return (
              <button
                key={p.provider_id}
                type="button"
                onClick={() => setSelectedProvider(p.provider_id)}
                disabled={!isSupported}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-metallic-900 border-sage shadow-glow-sage'
                    : isSupported
                    ? 'bg-metallic-900/40 border-metallic-800 hover:border-metallic-700'
                    : 'bg-metallic-950/20 border-metallic-900 opacity-40 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-cream">
                      {p.name.split(' ')[0]}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-sage" />}
                  </div>
                  <div className="text-xs text-cream font-medium mb-1">
                    {p.name}
                  </div>
                  <p className="text-[11px] text-metallic-400 leading-snug">
                    {p.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-metallic-850 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-metallic-500">
                    {p.supported_currencies.join(', ')}
                  </span>
                  {!isSupported && <span className="text-signal-orange">Currency mismatch</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Leader Authorization */}
      <div className="p-4 rounded-xl bg-metallic-900/60 border border-metallic-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cream">
            <Lock className="w-4 h-4 text-sage" />
            <span>Step 2: Team Leader Payout Authorization ({activeProvider?.name})</span>
          </div>
          {team.provider_authorized && (
            <span className="text-signal-green text-xs font-mono flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Provider Authorized</span>
            </span>
          )}
        </div>

        <p className="text-xs text-metallic-400 font-sans">
          Authorize your payout sender account. In sandbox mode, no bank authorization secrets are shared.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={accountRef}
            onChange={(e) => setAccountRef(e.target.value)}
            placeholder={`e.g. ${activeProvider?.placeholder}`}
            className="w-full sm:w-96 px-3 py-2 rounded-lg bg-metallic-950 border border-metallic-700 text-cream text-xs font-mono focus:outline-none focus:border-sage"
          />
          <button
            onClick={handleAuthorize}
            disabled={isAuthorizing || !accountRef.trim()}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-metallic-800 hover:bg-metallic-700 border border-metallic-700 text-cream text-xs font-mono transition-colors shrink-0"
          >
            {isAuthorizing ? 'AUTHORIZING...' : team.provider_authorized ? 'RE-AUTHORIZE' : 'AUTHORIZE SENDER'}
          </button>
        </div>
      </div>

      {/* 3. Recipient Destination Accounts Collection */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-metallic-400 uppercase tracking-wider">
          Step 3: Recipient Receiving Accounts ({activeProvider?.account_type_label})
        </div>

        <div className="space-y-2">
          {eligibleMembers.map((member) => {
            const isEditing = editingMemberId === member.id;
            const hasAcct = Boolean(member.payment_account_value);

            return (
              <div
                key={member.id}
                className="p-3.5 rounded-xl bg-metallic-900/40 border border-metallic-800 hover:bg-metallic-900/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-cream font-mono">
                      {member.name}
                    </span>
                    <span className="text-metallic-400 text-xs font-mono">
                      (@{member.github_username})
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-metallic-800 text-metallic-400">
                      {member.country}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-sage font-medium mt-0.5">
                    Allocation: {team.currency} {member.payout_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({member.final_percentage}%)
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  {isEditing ? (
                    <div className="flex items-center space-x-1.5 w-full sm:w-80">
                      <input
                        type="text"
                        value={tempAccountVal}
                        onChange={(e) => setTempAccountVal(e.target.value)}
                        placeholder={activeProvider?.placeholder}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-metallic-950 border border-sage text-cream text-xs font-mono focus:outline-none"
                      />
                      <button
                        onClick={() => saveRecipientAccount(member.id)}
                        disabled={isSavingAcct}
                        className="p-1.5 rounded-lg bg-sage text-metallic-950 hover:bg-sage-glow shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-metallic-300">
                        {member.payment_account_value || 'Missing receiving account'}
                      </span>
                      <button
                        onClick={() => startEditAccount(member)}
                        className="p-1 rounded text-metallic-400 hover:text-cream hover:bg-metallic-800"
                        title="Edit account"
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
      </div>

      {/* Footer Navigation */}
      <div className="pt-3 border-t border-metallic-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs font-mono text-metallic-400">
          {!allAccountsReady && (
            <span className="text-signal-orange">
              * Please ensure all {eligibleMembers.length} eligible recipients have verified receiving accounts.
            </span>
          )}
        </div>

        <button
          onClick={onProceedToConfirmation}
          disabled={!team.provider_authorized || !allAccountsReady}
          className="px-6 py-3 rounded-xl bg-cream hover:bg-cream-dim text-metallic-950 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-glow-sage disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>REVIEW FINAL PAYMENT CONFIRMATION</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
