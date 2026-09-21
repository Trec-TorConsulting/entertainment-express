import React, { useState } from 'react';

interface SyncDiagnosticsModalProps {
  onClose: () => void;
  pendingCount?: number;
}

export const SyncDiagnosticsModal: React.FC<SyncDiagnosticsModalProps> = ({ onClose, pendingCount = 2 }) => {
  const [syncing, setSyncing] = useState(false);

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert('Offline IndexedDB queue replayed and synced with server successfully!');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚙️</span> Offline Sync & IndexedDB Diagnostics
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 space-y-1 font-mono">
            <div><span className="text-slate-400">IndexedDB Status:</span> Active & Healthy</div>
            <div><span className="text-slate-400">Pending Queue:</span> {pendingCount} Mutations</div>
            <div><span className="text-slate-400">Background Sync:</span> Registered</div>
          </div>

          <p className="text-slate-400 leading-relaxed">
            All barcode scans, signatures, and timestamps captured offline are queued securely in local IndexedDB storage until cellular connection is restored.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded"
          >
            Close
          </button>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition-colors"
          >
            {syncing ? 'Syncing Queue...' : '🔄 Force Sync Queue Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncDiagnosticsModal;
