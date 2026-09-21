/**
 * IndexedDB helper for zero-signal offline field PWA operations.
 * Caches daily manifests, barcode lookup tables, signatures, and pending mutation queue.
 */

export interface OfflineMutation {
  id: string;
  mutation_uuid: string;
  action: string;
  booking_id?: string;
  payload: any;
  client_timestamp: string;
  synced: boolean;
}

const DB_NAME = 'entx_field_offline_db';
const DB_VERSION = 1;

export const openOfflineDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject('IndexedDB not supported in this browser');
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('mutations')) {
        db.createObjectStore('mutations', { keyPath: 'mutation_uuid' });
      }
      if (!db.objectStoreNames.contains('manifests')) {
        db.createObjectStore('manifests', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('barcodes')) {
        db.createObjectStore('barcodes', { keyPath: 'barcode' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const queueOfflineMutation = async (mutation: Omit<OfflineMutation, 'synced'>): Promise<void> => {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('mutations', 'readwrite');
    const store = tx.objectStore('mutations');
    const record: OfflineMutation = { ...mutation, synced: false };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getPendingMutations = async (): Promise<OfflineMutation[]> => {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('mutations', 'readonly');
    const store = tx.objectStore('mutations');
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []).filter((m: OfflineMutation) => !m.synced));
    req.onerror = () => reject(req.error);
  });
};
