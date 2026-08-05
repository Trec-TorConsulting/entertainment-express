/**
 * Offline cache + sync queue for the crew app.
 *
 * Uses AsyncStorage (already required by Expo) so offline mode works on
 * Expo SDK 50 without depending on expo-sqlite async APIs (SDK 51+).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  shifts: 'ee.offline.shifts',
  runSheets: 'ee.offline.run_sheets',
  checkIns: 'ee.offline.check_ins',
  actions: 'ee.offline.pending_actions',
  ready: 'ee.offline.ready',
} as const;

export interface CachedShift {
  id: string;
  name: string;
  booking_name: string;
  status: string;
  call_time: string;
  role: string;
  venue: string;
  created_at: string;
  updated_at?: string;
}

export interface CachedRunSheet {
  id: string;
  booking_id: string;
  content: string;
  created_at: string;
  synced: boolean;
}

export interface CachedCheckIn {
  id: string;
  shift_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  photo_uri?: string;
  synced: boolean;
  created_at?: string;
}

export interface PendingAction {
  id: string;
  action_type: string;
  entity_id: string;
  payload: any;
  created_at: string;
  synced: boolean;
}

async function readList<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeList<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export const initializeDatabase = async (): Promise<void> => {
  await AsyncStorage.setItem(KEYS.ready, new Date().toISOString());
  // Ensure keys exist
  for (const key of [KEYS.shifts, KEYS.runSheets, KEYS.checkIns, KEYS.actions]) {
    const existing = await AsyncStorage.getItem(key);
    if (existing == null) {
      await AsyncStorage.setItem(key, '[]');
    }
  }
  console.log('[Database] Offline cache initialized (AsyncStorage)');
};

export const cacheShift = async (shift: CachedShift): Promise<void> => {
  const shifts = await readList<CachedShift>(KEYS.shifts);
  const now = new Date().toISOString();
  const next = shifts.filter((s) => s.id !== shift.id);
  next.push({ ...shift, updated_at: now });
  await writeList(KEYS.shifts, next);
};

export const getCachedShift = async (shiftId: string): Promise<CachedShift | null> => {
  const shifts = await readList<CachedShift>(KEYS.shifts);
  return shifts.find((s) => s.id === shiftId) || null;
};

export const getAllCachedShifts = async (status?: string): Promise<CachedShift[]> => {
  const shifts = await readList<CachedShift>(KEYS.shifts);
  const filtered = status ? shifts.filter((s) => s.status === status) : shifts;
  return filtered.sort((a, b) => (b.call_time || '').localeCompare(a.call_time || ''));
};

export const cacheRunSheet = async (runSheet: CachedRunSheet): Promise<void> => {
  const sheets = await readList<CachedRunSheet>(KEYS.runSheets);
  const now = new Date().toISOString();
  const next = sheets.filter((s) => s.booking_id !== runSheet.booking_id);
  next.push({ ...runSheet, created_at: runSheet.created_at || now, synced: false });
  await writeList(KEYS.runSheets, next);
};

export const getCachedRunSheet = async (bookingId: string): Promise<CachedRunSheet | null> => {
  const sheets = await readList<CachedRunSheet>(KEYS.runSheets);
  return sheets.find((s) => s.booking_id === bookingId) || null;
};

export const storePendingCheckIn = async (checkIn: CachedCheckIn): Promise<void> => {
  const items = await readList<CachedCheckIn>(KEYS.checkIns);
  const now = new Date().toISOString();
  items.push({
    ...checkIn,
    synced: false,
    created_at: checkIn.created_at || now,
  });
  await writeList(KEYS.checkIns, items);
};

export const getUnsyncedCheckIns = async (): Promise<CachedCheckIn[]> => {
  const items = await readList<CachedCheckIn>(KEYS.checkIns);
  return items.filter((c) => !c.synced);
};

export const markCheckInSynced = async (checkInId: string): Promise<void> => {
  const items = await readList<CachedCheckIn>(KEYS.checkIns);
  await writeList(
    KEYS.checkIns,
    items.map((c) => (c.id === checkInId ? { ...c, synced: true } : c))
  );
};

export const storePendingAction = async (
  actionType: string,
  entityId: string,
  payload: any
): Promise<void> => {
  const items = await readList<PendingAction>(KEYS.actions);
  items.push({
    id: `${actionType}_${entityId}_${Date.now()}`,
    action_type: actionType,
    entity_id: entityId,
    payload,
    created_at: new Date().toISOString(),
    synced: false,
  });
  await writeList(KEYS.actions, items);
};

export const getUnsyncedActions = async (): Promise<PendingAction[]> => {
  const items = await readList<PendingAction>(KEYS.actions);
  return items.filter((a) => !a.synced);
};

export const markActionSynced = async (actionId: string): Promise<void> => {
  const items = await readList<PendingAction>(KEYS.actions);
  await writeList(
    KEYS.actions,
    items.map((a) => (a.id === actionId ? { ...a, synced: true } : a))
  );
};

export const clearOldCache = async (daysOld: number = 7): Promise<void> => {
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  const shifts = await readList<CachedShift>(KEYS.shifts);
  await writeList(
    KEYS.shifts,
    shifts.filter((s) => new Date(s.created_at).getTime() >= cutoff)
  );

  const sheets = await readList<CachedRunSheet>(KEYS.runSheets);
  await writeList(
    KEYS.runSheets,
    sheets.filter((s) => !s.synced || new Date(s.created_at).getTime() >= cutoff)
  );
};

/**
 * Replay unsynced check-ins and pending actions against the live API.
 * Safe to call on app resume / network restore.
 */
export const syncOfflineActions = async (
  postFn: (url: string, data: any) => Promise<any>
): Promise<{ synced: number; failed: number }> => {
  let synced = 0;
  let failed = 0;

  const checkIns = await getUnsyncedCheckIns();
  for (const checkIn of checkIns) {
    try {
      await postFn('/crew/check-in', {
        assignment_id: checkIn.shift_id,
        latitude: checkIn.latitude,
        longitude: checkIn.longitude,
        photo_url: checkIn.photo_uri,
      });
      await markCheckInSynced(checkIn.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  const actions = await getUnsyncedActions();
  for (const action of actions) {
    try {
      if (action.action_type === 'checkout') {
        await postFn('/crew/check-out', action.payload);
      } else if (action.action_type === 'checkin') {
        await postFn('/crew/check-in', action.payload);
      } else if (action.action_type === 'accept') {
        await postFn(`/crew/shift/${action.entity_id}/accept`, action.payload || {});
      } else if (action.action_type === 'decline') {
        await postFn(`/crew/shift/${action.entity_id}/decline`, action.payload || {});
      }
      await markActionSynced(action.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
};

export const closeDatabase = async (): Promise<void> => {
  // AsyncStorage has no connection to close.
};
