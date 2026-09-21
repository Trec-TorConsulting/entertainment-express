import React, { useEffect, useState } from 'react';

interface OfflineIndicatorProps {
  onSyncNow?: () => void;
  pendingCount?: number;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSyncNow, pendingCount = 0 }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={`px-4 py-2 text-xs flex items-center justify-between font-mono font-semibold transition-colors ${
        !isOnline
          ? 'bg-amber-950 text-amber-300 border-b border-amber-800'
          : pendingCount > 0
          ? 'bg-blue-950 text-blue-300 border-b border-blue-800'
          : 'bg-slate-900 text-slate-400 border-b border-slate-800'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
        <span>{!isOnline ? 'OFFLINE (Zero-Signal Mode Active)' : 'Online Mode'}</span>
        {pendingCount > 0 && (
          <span className="bg-amber-900/80 text-amber-200 px-2 py-0.5 rounded border border-amber-700 text-[10px]">
            {pendingCount} Pending Replay Queue
          </span>
        )}
      </div>

      {pendingCount > 0 && onSyncNow && (
        <button
          onClick={onSyncNow}
          className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded transition-colors"
        >
          🔄 Sync Now
        </button>
      )}
    </div>
  );
};

export default OfflineIndicator;
