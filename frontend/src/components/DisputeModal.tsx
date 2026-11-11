import React, { useState } from 'react';
import { X, Sliders, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onAction: (data: {
    github_username: string;
    action: 'flag' | 'adjust_weight' | 'approve';
    reason?: string;
    suggested_weight_change?: number;
  }) => Promise<void>;
  currentAdjustment: number;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  username,
  onAction,
  currentAdjustment,
}) => {
  const [tab, setTab] = useState<'adjust' | 'flag'>('adjust');
  const [adjustment, setAdjustment] = useState(currentAdjustment || 0);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (action: 'flag' | 'adjust_weight') => {
    setIsSubmitting(true);
    try {
      if (action === 'adjust_weight') {
        await onAction({
          github_username: username,
          action: 'adjust_weight',
          suggested_weight_change: Number(adjustment),
        });
      } else {
        await onAction({
          github_username: username,
          action: 'flag',
          reason: reason || 'Flagged for re-evaluation of contribution volume and complexity.',
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-metallic-950/80 backdrop-blur-md">
      <div className="glass-panel rounded-2xl p-6 w-full max-w-lg border border-metallic-700 shadow-glass animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-metallic-800">
          <div>
            <div className="text-[10px] font-mono uppercase text-sage">Consensus & Dispute Room</div>
            <h3 className="text-lg font-bold text-cream">
              Review Split for @{username}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-metallic-400 hover:text-cream hover:bg-metallic-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex space-x-2 my-4">
          <button
            onClick={() => setTab('adjust')}
            className={`flex-1 py-2 text-xs font-mono rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
              tab === 'adjust'
                ? 'bg-metallic-800 text-cream border border-metallic-700'
                : 'text-metallic-400 hover:text-cream'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ADJUST WEIGHT (+/- %)</span>
          </button>
          <button
            onClick={() => setTab('flag')}
            className={`flex-1 py-2 text-xs font-mono rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
              tab === 'flag'
                ? 'bg-metallic-800 text-cream border border-metallic-700'
                : 'text-metallic-400 hover:text-cream'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>FLAG SPECIFIC COMMIT</span>
          </button>
        </div>

        {/* Form Tab 1: Adjust Weight */}
        {tab === 'adjust' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-metallic-400 mb-1">
                Proposed Percentage Shift ({adjustment > 0 ? `+${adjustment}%` : `${adjustment}%`})
              </label>
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={adjustment}
                onChange={(e) => setAdjustment(parseInt(e.target.value))}
                className="w-full accent-sage h-1.5 bg-metallic-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-metallic-500 mt-1">
                <span>-15% (Reduction)</span>
                <span className="text-sage font-bold">0% (Baseline AI)</span>
                <span>+15% (Merit Boost)</span>
              </div>
            </div>

            <p className="text-[11px] font-mono text-metallic-400 bg-metallic-900/60 p-3 rounded-lg border border-metallic-800">
              Note: Manually adjusting weights will re-normalize the remaining prize pool across all contributors and require unanimous consensus to lock.
            </p>

            <button
              disabled={isSubmitting}
              onClick={() => handleSubmit('adjust_weight')}
              className="w-full py-2.5 rounded-lg bg-cream hover:bg-cream-dim text-metallic-950 font-mono text-xs font-bold uppercase transition-all"
            >
              {isSubmitting ? 'RECALCULATING...' : 'APPLY WEIGHT ADJUSTMENT'}
            </button>
          </div>
        )}

        {/* Form Tab 2: Flag Commit */}
        {tab === 'flag' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-metallic-400 mb-1">
                Dispute Rationale / Commit Reference
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Commit a1c78e4 included generated boilerplate; requests human review."
                className="w-full p-3 rounded-lg bg-metallic-900 border border-metallic-800 focus:border-sage focus:outline-none text-xs font-sans text-cream placeholder-metallic-600"
              />
            </div>

            <button
              disabled={isSubmitting}
              onClick={() => handleSubmit('flag')}
              className="w-full py-2.5 rounded-lg bg-signal-red hover:bg-signal-red/90 text-white font-mono text-xs font-bold uppercase transition-all"
            >
              {isSubmitting ? 'SUBMITTING FLAG...' : 'FLAG COMMIT FOR TEAM REVIEW'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
