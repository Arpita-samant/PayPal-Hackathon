import React from 'react';
import { GitBranch, Cpu, DollarSign } from 'lucide-react';

interface NavbarProps {
  onNewProject: () => void;
  activeTeamName?: string;
  paypalEnv: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewProject, activeTeamName, paypalEnv }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-metallic-800 bg-metallic-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand Logo - Nothing OS Stark Aesthetic */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full border border-metallic-700 bg-metallic-900 flex items-center justify-center shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-sage animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-mono text-xs sm:text-sm tracking-widest uppercase font-bold text-cream">
                FAIRSHARE
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-metallic-700 text-metallic-400 bg-metallic-900">
                v1.0
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-mono text-metallic-500 uppercase tracking-wider hidden xs:block">
              AI Audit • PayPal Payouts
            </p>
          </div>
        </div>

        {/* Center Active Project Indicator */}
        {activeTeamName && (
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full border border-metallic-800 bg-metallic-900/60 text-xs font-mono max-w-xs truncate">
            <GitBranch className="w-3.5 h-3.5 text-sage shrink-0" />
            <span className="text-metallic-400">ACTIVE:</span>
            <span className="text-cream font-medium truncate">{activeTeamName}</span>
          </div>
        )}

        {/* Right Status Badges & Action */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-md border border-metallic-800 bg-metallic-900/40 text-[11px] font-mono text-metallic-400">
            <Cpu className="w-3 h-3 text-sage" />
            <span>GEMINI</span>
            <span className="text-metallic-600">|</span>
            <DollarSign className="w-3 h-3 text-cream" />
            <span className="uppercase">{paypalEnv}</span>
          </div>

          <button
            onClick={onNewProject}
            className="px-3 py-1.5 rounded-xl border border-metallic-700 hover:border-sage bg-metallic-900 hover:bg-metallic-850 text-xs font-mono text-cream transition-all flex items-center space-x-1 cursor-pointer shrink-0"
          >
            <span>+ NEW</span>
            <span className="hidden sm:inline"> PROJECT</span>
          </button>
        </div>

      </div>
    </header>
  );
};
