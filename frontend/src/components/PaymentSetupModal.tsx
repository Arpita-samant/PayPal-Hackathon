import React, { useState } from 'react';
import { Team, PaymentProviderInfo, TeamMember } from '../types';
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Check,
  Edit2
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

  const allAccountsReady = eligibleMembers.length > 0 && eligibleMembers.every((m) => Boolean(m.payment_account_value && m.account_verified));

  return (
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 border border-metallic-700 bg-metallic-900/90 shadow-glass space-y-5 sm:space-y-6">
      
      {/* Header */}
      <div className="pb-4 border-b border-metallic-800">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-cream flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-sage" />
          <span>Connect Global Payment Rails</span>
        </h2>
        <p className="text-xs sm:text-sm text-metallic-400 mt-1">
          Select a payment provider matching currency ({team.currency}). Authorize your payout account and verify recipient destinations.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-signal-red/30 bg-signal-red/10 text-signal-red text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* 1. Payment Provider Selection Grid */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-metallic-400 uppercase tracking-wider font-bold">
          Step 1: Select Disbursement Gateway
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {providers.map((p) => {
            const isSelected = selectedProvider === p.provider_id;
            const isCurrencySupported = p.supported_currencies.includes(team.currency);

            return (
              <button
                key={p.provider_id}
                type="button"
                onClick={() => isCurrencySupported && setSelectedProvider(p.provider_id)}
                disabled={!isCurrencySupported}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-sage/10 border-sage shadow-glow-sm'
                    : isCurrencySupported
                    ? 'bg-metallic-950/70 border-metallic-800 hover:border-metallic-700 cursor-pointer'
                    : 'bg-metallic-950/30 border-metallic-900 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-cream">{p.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-sage" />}
                </div>
                <p className="text-[11px] text-metallic-400 font-sans mb-3 line-clamp-2">
                  {p.description}
                </p>
                <div className="text-[10px] font-mono text-metallic-500 space-y-0.5">
                  <div>Currencies: {p.supported_currencies.slice(0, 3).join(', ')}</div>
                  <div>Account: {p.account_type_label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Team Leader Authorization */}
      <div className="p-4 sm:p-5 rounded-2xl border border-metallic-800 bg-metallic-950/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-cream font-bold">
            Step 2: Team Leader Payout Authorization
          </span>
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={accountRef}
            onChange={(e) => setAccountRef(e.target.value)}
            placeholder={`e.g. ${activeProvider?.placeholder}`}
            className="w-full sm:w-96 px-3 py-2.5 rounded-xl bg-metallic-900 border border-metallic-700 text-cream text-xs font-mono focus:outline-none focus:border-sage"
          />
          <button
            onClick={handleAuthorize}
            disabled={isAuthorizing || !accountRef.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sage hover:bg-cream text-metallic-950 font-bold text-xs font-mono transition-colors shrink-0 shadow-glow cursor-pointer disabled:opacity-50"
          >
            {isAuthorizing ? 'AUTHORIZING...' : team.provider_authorized ? 'RE-AUTHORIZE' : 'AUTHORIZE SENDER'}
          </button>
        </div>
      </div>

      {/* 3. Recipient Destination Accounts Collection */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-metallic-400 uppercase tracking-wider font-bold">
          Step 3: Recipient Receiving Accounts ({activeProvider?.account_type_label})
        </div>

        <div className="space-y-2.5">
          {eligibleMembers.map((member) => {
            const isEditing = editingMemberId === member.id;

            return (
              <div
                key={member.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-metallic-950/60 border border-metallic-800 hover:bg-metallic-900/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs sm:text-sm text-cream font-mono">
                      {member.name}
                    </span>
                    <span className="text-metallic-400 text-xs font-mono">
                      (@{member.github_username})
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
                        className="w-full px-2.5 py-1.5 rounded-lg bg-metallic-900 border border-sage text-cream text-xs font-mono focus:outline-none"
                      />
                      <button
                        onClick={() => saveRecipientAccount(member.id)}
                        disabled={isSavingAcct}
                        className="p-2 rounded-lg bg-sage text-metallic-950 hover:bg-cream shrink-0 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-metallic-300 truncate max-w-[200px] sm:max-w-none">
                        {member.payment_account_value || <span className="text-signal-red">Missing account</span>}
                      </span>
                      <button
                        onClick={() => startEditAccount(member)}
                        className="p-1.5 rounded-lg text-metallic-400 hover:text-cream hover:bg-metallic-800 transition-colors cursor-pointer"
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
              * Please ensure all {eligibleMembers.length} eligible recipients have receiving accounts.
            </span>
          )}
        </div>

        <button
          onClick={onProceedToConfirmation}
          disabled={!team.provider_authorized || !allAccountsReady}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
            team.provider_authorized && allAccountsReady
              ? 'bg-sage text-metallic-950 hover:bg-cream shadow-glow cursor-pointer'
              : 'bg-metallic-800 text-metallic-500 border border-metallic-700 cursor-not-allowed opacity-60'
          }`}
        >
          <span>REVIEW FINAL PAYMENT CONFIRMATION</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
