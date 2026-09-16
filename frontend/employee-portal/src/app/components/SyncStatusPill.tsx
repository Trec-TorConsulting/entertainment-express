import React, { useEffect, useState } from 'react';
import { syncEngine, SyncEngineState } from '../offline/syncEngine';
import { Wifi, WifiOff, RefreshCw, HardDrive } from 'lucide-react';

interface SyncStatusPillProps {
  onOpenInspector?: () => void;
}

export const SyncStatusPill: React.FC<SyncStatusPillProps> = ({ onOpenInspector }) => {
  const [state, setState] = useState<SyncEngineState>(syncEngine.getState());

  useEffect(() => {
    return syncEngine.subscribe((newState) => setState(newState));
  }, []);

  if (state.isOnline && state.pendingCount === 0 && !state.isSyncing) {
    return (
      <button
        onClick={onOpenInspector}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Online (Synced)</span>
      </button>
    );
  }

  if (state.isSyncing) {
    return (
      <button
        onClick={onOpenInspector}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Syncing ({state.pendingCount} pending)...</span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpenInspector}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline ({state.pendingCount} pending)</span>
    </button>
  );
};
