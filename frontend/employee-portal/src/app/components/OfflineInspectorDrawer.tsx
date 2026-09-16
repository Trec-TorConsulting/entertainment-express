import React, { useEffect, useState } from 'react';
import { syncEngine, SyncEngineState } from '../offline/syncEngine';
import { offlineDB, OfflineMutation } from '../offline/db';
import { X, RefreshCw, Trash2, CheckCircle2, AlertTriangle, Wifi, WifiOff, HardDrive } from 'lucide-react';

interface OfflineInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineInspectorDrawer: React.FC<OfflineInspectorDrawerProps> = ({ isOpen, onClose }) => {
  const [engineState, setEngineState] = useState<SyncEngineState>(syncEngine.getState());
  const [pendingItems, setPendingItems] = useState<OfflineMutation[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshItems = async () => {
    try {
      const items = await offlineDB.getPendingMutations();
      setPendingItems(items);
    } catch {
      setPendingItems([]);
    }
  };

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state) => {
      setEngineState(state);
      refreshItems();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshItems();
    }
  }, [isOpen]);

  const handleForceSync = async () => {
    setLoading(true);
    await syncEngine.flushQueue();
    await refreshItems();
    setLoading(false);
  };

  const handleRemove = async (id?: number) => {
    if (!id) return;
    await offlineDB.removeMutation(id);
    await refreshItems();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#12161f] border-l border-slate-800 h-full flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-base">Offline Sync Inspector</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network & Storage Summary Banner */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Connection Status</span>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {engineState.isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">Zero-Signal (Offline)</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Pending Local Mutations</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              {pendingItems.length} queued
            </span>
          </div>

          {engineState.lastSyncedAt && (
            <div className="text-[11px] text-slate-400">
              Last successful sync: {new Date(engineState.lastSyncedAt).toLocaleTimeString()}
            </div>
          )}

          <button
            onClick={handleForceSync}
            disabled={!engineState.isOnline || loading || pendingItems.length === 0}
            className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-all shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || engineState.isSyncing ? 'animate-spin' : ''}`} />
            {engineState.isSyncing ? 'Syncing Queue...' : 'Force Sync Now'}
          </button>
        </div>

        {/* Queue Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {pendingItems.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
              <p className="text-sm font-medium text-slate-300">All local changes are synced!</p>
              <p className="text-xs text-slate-400">Scans, signatures, and timesheets will queue here automatically when working offline.</p>
            </div>
          ) : (
            pendingItems.map((item) => (
              <div
                key={item.mutation_uuid}
                className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 flex flex-col space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                  <span className="font-semibold text-indigo-300">{item.action}</span>
                  <span>{new Date(item.client_timestamp).toLocaleTimeString()}</span>
                </div>

                {item.booking && (
                  <div className="text-slate-400">
                    Booking: <span className="text-slate-300">{item.booking}</span>
                  </div>
                )}

                {item.error_message && (
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.error_message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                  <span className="text-slate-400">Status: <span className="capitalize text-amber-300">{item.status}</span></span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Discard
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
