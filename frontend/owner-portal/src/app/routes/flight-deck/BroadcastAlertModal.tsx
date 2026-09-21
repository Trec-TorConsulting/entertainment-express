import React, { useState } from 'react';

interface BroadcastAlertModalProps {
  onClose: () => void;
  affectedCount?: number;
}

export const BroadcastAlertModal: React.FC<BroadcastAlertModalProps> = ({ onClose, affectedCount = 4 }) => {
  const [alertType, setAlertType] = useState<'watch' | 'warning' | 'rain_date'>('warning');
  const [customMsg, setCustomMsg] = useState(
    'Weather advisory: Severe wind gusts forecast for this Saturday. Sandbag ballasts and safety tie-downs mandated.'
  );
  const [sending, setSending] = useState(false);

  const handleSendBroadcast = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      alert(`Broadcast SMS and Emails sent successfully to ${affectedCount} clients!`);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full text-slate-100 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📢</span> Weather Risk Broadcast Advisory
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <p className="text-xs text-slate-400">
          Send automated SMS and Email alerts to <strong className="text-amber-400">{affectedCount} outdoor event hosts</strong> flagged for high wind or precipitation.
        </p>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Alert Category</label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100"
            >
              <option value="watch">Weather Watch (Precautionary Advisory)</option>
              <option value="warning">Weather Warning (High Wind / Rain Alert)</option>
              <option value="rain_date">1-Click Rain Date Reschedule Offer</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Message Body</label>
            <textarea
              rows={4}
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSendBroadcast}
            disabled={sending}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
          >
            {sending ? 'Sending Broadcast...' : '🚀 Send Batch Broadcast'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastAlertModal;
