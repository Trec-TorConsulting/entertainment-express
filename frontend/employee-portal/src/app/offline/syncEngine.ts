import { offlineDB, OfflineMutation } from './db';

type SyncListener = (state: SyncEngineState) => void;

export interface SyncEngineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
}

class SyncEngine {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private retryTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      this.updatePendingCount();
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): SyncEngineState {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: 0,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };
  }

  private notify() {
    this.updatePendingCount().then((count) => {
      const state: SyncEngineState = {
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        pendingCount: count,
        lastSyncedAt: this.lastSyncedAt,
        lastError: this.lastError,
      };
      this.listeners.forEach((fn) => fn(state));
    });
  }

  public async updatePendingCount(): Promise<number> {
    try {
      const pending = await offlineDB.getPendingMutations();
      return pending.length;
    } catch {
      return 0;
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notify();

    if (online) {
      this.flushQueue();
    }
  }

  public async flushQueue(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;

    try {
      const pending = await offlineDB.getPendingMutations();
      if (pending.length === 0) {
        this.notify();
        return;
      }

      this.isSyncing = true;
      this.lastError = null;
      this.notify();

      // Format payload for batch API
      const payloadMutations = pending.map((m) => ({
        mutation_uuid: m.mutation_uuid,
        action: m.action,
        booking: m.booking,
        payload: m.payload,
        client_timestamp: m.client_timestamp,
      }));

      // Mark items as syncing
      for (const item of pending) {
        if (item.id) await offlineDB.updateMutationStatus(item.id, 'syncing');
      }

      const response = await fetch('/api/method/entertainment_express.api.offline_sync.sync_offline_batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Frappe-CSRF-Token': (window as any).frappe?.csrf_token || '',
        },
        body: JSON.stringify({ mutations: payloadMutations }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const results = data.message?.results || [];

      // Process results
      for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        const res = results.find((r: any) => r.mutation_uuid === item.mutation_uuid) || results[i];

        if (res && res.status === 'Success') {
          if (item.id) await offlineDB.removeMutation(item.id);
        } else {
          if (item.id) await offlineDB.updateMutationStatus(item.id, 'failed', res?.error || 'Sync failed');
        }
      }

      this.lastSyncedAt = new Date().toISOString();
    } catch (err: any) {
      this.lastError = err.message || 'Network sync error';
      // Schedule exponential backoff retry if online
      if (this.isOnline) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = setTimeout(() => this.flushQueue(), 15000);
      }
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  // Enqueue new mutation and auto-flush if online
  public async queueMutation(
    action: string,
    payload: any,
    booking?: string
  ): Promise<string> {
    const uuid = 'm-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    await offlineDB.enqueueMutation({
      mutation_uuid: uuid,
      endpoint: 'sync_offline_batch',
      action,
      booking,
      payload,
      client_timestamp: new Date().toISOString(),
    });

    this.notify();

    if (this.isOnline) {
      this.flushQueue();
    }

    return uuid;
  }
}

export const syncEngine = new SyncEngine();
