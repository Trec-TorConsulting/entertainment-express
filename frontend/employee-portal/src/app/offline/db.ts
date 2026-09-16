// IndexedDB storage layer for Zero-Signal Field Sync

export interface OfflineMutation {
  id?: number;
  mutation_uuid: string;
  endpoint: string;
  action: string;
  booking?: string;
  payload: any;
  client_timestamp: string;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
  error_message?: string;
}

export interface OfflineManifest {
  worker: string;
  date: string;
  synced_at: string;
  manifests: any[];
  item_catalog: any[];
}

export interface MediaBlobItem {
  id?: number;
  mutation_uuid: string;
  booking: string;
  tag: string; // signature, damage_photo, load_photo
  blob_data: string; // base64 string
  created_at: string;
}

const DB_NAME = 'EE_Employee_Offline_DB';
const DB_VERSION = 1;

class OfflineDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in environment'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('manifests')) {
          db.createObjectStore('manifests', { keyPath: 'date' });
        }

        if (!db.objectStoreNames.contains('mutationQueue')) {
          const store = db.createObjectStore('mutationQueue', { keyPath: 'id', autoIncrement: true });
          store.createIndex('mutation_uuid', 'mutation_uuid', { unique: true });
          store.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('mediaBlobs')) {
          const store = db.createObjectStore('mediaBlobs', { keyPath: 'id', autoIncrement: true });
          store.createIndex('mutation_uuid', 'mutation_uuid', { unique: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Manifest Storage ---
  async saveManifest(manifest: OfflineManifest): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('manifests', 'readwrite');
      const store = tx.objectStore('manifests');
      const req = store.put(manifest);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getManifest(dateStr: string): Promise<OfflineManifest | null> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('manifests', 'readonly');
      const store = tx.objectStore('manifests');
      const req = store.get(dateStr);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Mutation Queue ---
  async enqueueMutation(mutation: Omit<OfflineMutation, 'id' | 'retry_count' | 'status'>): Promise<number> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutationQueue', 'readwrite');
      const store = tx.objectStore('mutationQueue');
      const fullItem: OfflineMutation = {
        ...mutation,
        retry_count: 0,
        status: 'pending',
      };
      const req = store.add(fullItem);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingMutations(): Promise<OfflineMutation[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutationQueue', 'readonly');
      const store = tx.objectStore('mutationQueue');
      const req = store.getAll();
      req.onsuccess = () => {
        const items: OfflineMutation[] = req.result || [];
        resolve(items.filter((m) => m.status === 'pending' || m.status === 'failed'));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async updateMutationStatus(id: number, status: 'pending' | 'syncing' | 'failed', error?: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutationQueue', 'readwrite');
      const store = tx.objectStore('mutationQueue');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          item.status = status;
          if (error) item.error_message = error;
          if (status === 'failed') item.retry_count = (item.retry_count || 0) + 1;
          store.put(item);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async removeMutation(id: number): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutationQueue', 'readwrite');
      const store = tx.objectStore('mutationQueue');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Media Storage ---
  async saveMediaBlob(media: Omit<MediaBlobItem, 'id'>): Promise<number> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mediaBlobs', 'readwrite');
      const store = tx.objectStore('mediaBlobs');
      const req = store.add(media);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  }
}

export const offlineDB = new OfflineDB();
