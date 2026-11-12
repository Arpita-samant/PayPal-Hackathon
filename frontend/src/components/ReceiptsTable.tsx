import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  Download, 
  ShieldCheck, 
  Receipt,
  Search
} from 'lucide-react';
import { api } from '../lib/api';

interface ReceiptsTableProps {
  receipts: any[];
  currency: string;
  teamId?: string;
  onReceiptsUpdated?: () => void;
}

export const ReceiptsTable: React.FC<ReceiptsTableProps> = ({
  receipts,
  currency,
  teamId,
  onReceiptsUpdated,
}) => {
  const [retryingBatchId, setRetryingBatchId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');

  if (!receipts || receipts.length === 0) {
    return (
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-8 border border-metallic-800 bg-metallic-900/60 text-center space-y-3 max-w-xl mx-auto">
        <Receipt className="w-8 h-8 text-metallic-600 mx-auto" />
        <h3 className="text-base font-bold text-cream font-mono">No Payout Receipts Yet</h3>
        <p className="text-xs text-metallic-400 font-mono">
          Disburse prize money through the Payment Gateways tab to generate permanent, immutable transaction receipts.
        </p>
      </div>
    );
  }

  const handleRetryFailed = async (batchId: string) => {
    if (!teamId) return;
    setRetryingBatchId(batchId);
    setRetryMessage(null);
    try {
      await api.retryPayout(teamId, {
        batch_id: batchId,
        simulate: true,
      });
      setRetryMessage(`Successfully executed retry for batch ${batchId}.`);
      if (onReceiptsUpdated) {
        onReceiptsUpdated();
      }
    } catch (err: any) {
      setRetryMessage(`Retry failed: ${err.message}`);
    } finally {
      setRetryingBatchId(null);
    }
  };

  const handleDownloadReceipt = (receipt: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(receipt, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fairshare_receipt_${receipt.batch_id || receipt.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 border border-metallic-700 bg-metallic-900/90 shadow-glass space-y-5 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-metallic-800">
        <div>
          <h3 className="text-xl font-bold text-cream flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-sage" />
            <span>Batched Payout Ledger</span>
          </h3>
          <p className="text-xs text-metallic-400 font-mono mt-0.5">
            Immutable financial receipts and transaction references.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-metallic-500" />
            <input
              type="text"
              placeholder="Search recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-44 pl-8 pr-3 py-1.5 rounded-xl border border-metallic-800 bg-metallic-950 text-cream text-xs font-mono focus:border-sage focus:outline-none"
            />
          </div>

          <div className="flex items-center rounded-xl border border-metallic-800 bg-metallic-950 p-0.5 text-[11px] font-mono self-start sm:self-auto">
            {(['ALL', 'SUCCESS', 'FAILED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  statusFilter === st ? 'bg-sage text-metallic-950 font-bold' : 'text-metallic-400 hover:text-cream'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {retryMessage && (
        <div className="p-3 rounded-xl border border-sage/30 bg-sage/10 text-sage text-xs font-mono flex items-center justify-between">
          <span>{retryMessage}</span>
          <button onClick={() => setRetryMessage(null)} className="text-[10px] uppercase font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Batches Stack */}
      <div className="space-y-4 sm:space-y-5">
        {receipts.map((r) => {
          const batchId = r.batch_id || r.paypal_batch_id || r.id;
          const status = r.payout_status || r.paypal_payout_status || 'SUCCESS';
          const items: any[] = r.disbursement_details || [];
          const hasFailedItems = items.some((i) => i.status === 'FAILED');

          const filteredItems = items.filter((item) => {
            const matchesSearch = 
              !searchTerm || 
              (item.recipient_username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
              (item.recipient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
              (item.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = 
              statusFilter === 'ALL' || item.status === statusFilter;

            return matchesSearch && matchesStatus;
          });

          return (
            <div
              key={batchId}
              className="p-4 sm:p-5 rounded-2xl border border-metallic-800 bg-metallic-950/70 font-mono text-xs space-y-3.5"
            >
              {/* Batch Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-metallic-850">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-metallic-500 text-[10px]">BATCH:</span>
                    <span className="text-sage font-bold select-all truncate max-w-[200px] sm:max-w-none">{batchId}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-metallic-700 bg-metallic-850 text-metallic-300">
                      {r.provider || 'PayPal'}
                    </span>
                  </div>
                  <div className="text-[10px] text-metallic-400">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <div className="text-cream font-bold text-xs sm:text-sm">
                      {r.currency || currency} {Number(r.total_payout_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {status === 'SUCCESS' ? (
                    <span className="flex items-center space-x-1 text-signal-green text-[10px] px-2.5 py-1 rounded-full bg-signal-green/10 border border-signal-green/20 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PAID</span>
                    </span>
                  ) : hasFailedItems ? (
                    <span className="flex items-center space-x-1 text-signal-red text-[10px] px-2.5 py-1 rounded-full bg-signal-red/10 border border-signal-red/20 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>PARTIAL</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-yellow-400 text-[10px] px-2.5 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{status}</span>
                    </span>
                  )}

                  <button
                    onClick={() => handleDownloadReceipt(r)}
                    title="Export Receipt JSON"
                    className="p-1.5 rounded-lg border border-metallic-700 hover:border-sage text-metallic-400 hover:text-cream transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recipient Itemized Table */}
              <div className="divide-y divide-metallic-850 rounded-xl border border-metallic-850 overflow-hidden bg-metallic-900/40">
                {filteredItems.length === 0 ? (
                  <div className="p-3 text-center text-metallic-500 text-xs">
                    No matching records found.
                  </div>
                ) : (
                  filteredItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-cream font-bold truncate">{item.recipient_name || item.recipient_username}</span>
                          <span className="text-metallic-500 text-[11px]">(@{item.recipient_username})</span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-metallic-400 truncate">
                          {item.receiving_account || item.paypal_email}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                        <div className="text-right">
                          <div className="text-cream font-bold">
                            {item.currency || currency} {Number(item.amount).toFixed(2)}
                          </div>
                          <div className="text-[9px] text-metallic-500 select-all truncate max-w-[120px] sm:max-w-none">
                            {item.transaction_id || 'TX-PENDING'}
                          </div>
                        </div>

                        <div>
                          {item.status === 'FAILED' ? (
                            <span className="text-signal-red text-[10px] px-2 py-0.5 rounded-full bg-signal-red/10 border border-signal-red/20 font-bold">
                              FAILED
                            </span>
                          ) : (
                            <span className="text-signal-green text-[10px] px-2 py-0.5 rounded-full bg-signal-green/10 border border-signal-green/20 font-bold">
                              SUCCESS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Retry Failed Transactions Option */}
              {hasFailedItems && teamId && (
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-signal-red/5 p-3 rounded-xl border border-signal-red/20">
                  <div className="text-signal-red text-xs">
                    Failed transactions detected.
                  </div>

                  <button
                    onClick={() => handleRetryFailed(batchId)}
                    disabled={retryingBatchId === batchId}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-signal-red text-metallic-950 font-bold text-xs flex items-center justify-center space-x-1 hover:bg-signal-red/80 disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${retryingBatchId === batchId ? 'animate-spin' : ''}`} />
                    <span>Retry Failed ({items.filter((i) => i.status === 'FAILED').length})</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
