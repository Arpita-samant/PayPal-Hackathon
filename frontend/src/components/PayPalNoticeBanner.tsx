import React, { useState } from 'react';
import { ExternalLink, ShieldAlert, Sparkles, ChevronDown, ChevronUp, UserCheck, CreditCard } from 'lucide-react';

export const PayPalNoticeBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-full rounded-2xl border border-sage/30 bg-gradient-to-r from-metallic-900/95 via-metallic-900/85 to-metallic-950/95 backdrop-blur-xl shadow-glass overflow-hidden transition-all">
      {/* Top Banner Bar */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-sage/15 border border-sage/35 flex items-center justify-center text-sage shrink-0 shadow-glow-sm">
            <CreditCard className="w-5 h-5 text-sage" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sage font-bold">
                Important Notice // PayPal Payouts & Account Requirements
              </span>
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-signal-green/10 text-signal-green border border-signal-green/20">
                Live Distribution
              </span>
            </div>
            <p className="text-xs sm:text-sm text-cream font-medium mt-0.5">
              Prize money will be disbursed and distributed to all team members using PayPal.
            </p>
          </div>
        </div>

        {/* Action Button & Toggle */}
        <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
          <a
            href="https://www.paypal.com/in/webapps/mpp/account-selection?utm_source=chatgpt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-sage text-metallic-950 font-mono text-xs font-bold hover:bg-cream transition-all flex items-center space-x-1.5 shadow-glow"
          >
            <span>Create PayPal Account</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-metallic-400 hover:text-metallic-200 hover:bg-metallic-800/60 transition-colors"
            title={isExpanded ? 'Collapse instructions' : 'Expand instructions'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Detailed Instructions */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-metallic-800/60 text-xs font-mono text-metallic-300 grid grid-cols-1 md:grid-cols-2 gap-3 bg-metallic-950/40">
          <div className="p-3 rounded-xl border border-metallic-800 bg-metallic-900/50 space-y-1">
            <div className="text-sage font-bold flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Team Leader Requirement</span>
            </div>
            <p className="text-[11px] text-metallic-400 leading-relaxed">
              The team leader must have a <strong className="text-cream">PayPal Developer Account</strong> to disburse the prize pool via batched payouts.
            </p>
            <div className="pt-1">
              <a
                href="https://developer.paypal.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-sage hover:underline text-[11px]"
              >
                <span>PayPal Developer Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-metallic-800 bg-metallic-900/50 space-y-1">
            <div className="text-sage font-bold flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Team Member Requirement</span>
            </div>
            <p className="text-[11px] text-metallic-400 leading-relaxed">
              All team members must have an active <strong className="text-cream">PayPal account</strong> (developer sandbox or personal/business) linked to their email to receive their calculated prize share.
            </p>
            <div className="pt-1">
              <a
                href="https://www.paypal.com/in/webapps/mpp/account-selection?utm_source=chatgpt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-cream hover:underline text-[11px]"
              >
                <span>Sign Up / Create Account Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
