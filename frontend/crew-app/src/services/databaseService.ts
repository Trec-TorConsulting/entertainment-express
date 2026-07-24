/**
 * Database Service - SQLite Offline Cache
 * Provides offline support with automatic sync when online
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

const DB_NAME = 'entertainment_express.db';

interface CachedShift {
  id: string;
  name: string;
  booking_name: string;
  status: string;
  call_time: string;
  role: string;
  venue: string;
  created_at: string;
}

interface CachedRunSheet {
  id: string;
  booking_id: string;
  content: string; // JSON stringified
  created_at: string;
  synced: boolean;
}

interface CachedCheckIn {
  id: string;
  shift_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  photo_uri?: string;
  synced: boolean;
}

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize database
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);

    // Enable foreign keys
    await db.runAsync('PRAGMA foreign_keys = ON');

    // Create tables
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS shifts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        booking_name TEXT NOT NULL,
        status TEXT NOT NULL,
        call_time TEXT,
        role TEXT,
        venue TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS run_sheets (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `);

    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS check_ins (
        id TEXT PRIMARY KEY,
        shift_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp TEXT NOT NULL,
        photo_uri TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);

    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS pending_actions (
        id TEXT PRIMARY KEY,
        action_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `);

    // Create indexes for performance
    await db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
      CREATE INDEX IF NOT EXISTS idx_check_ins_shift_id ON check_ins(shift_id);
      CREATE INDEX IF NOT EXISTS idx_pending_actions_synced ON pending_actions(synced);
    `);

    console.log('[Database] Initialized successfully');
  } catch (error) {
    console.error('[Database] Initialization error:', error);
    throw error;
  }
};

/**
 * Cache a shift
 */
export const cacheShift = async (shift: CachedShift): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  try {
    const now = new Date().toISOString();
    await db.runAsync(
      `
      INSERT OR REPLACE INTO shifts 
      (id, name, booking_name, status, call_time, role, venue, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        shift.id,
        shift.name,
        shift.booking_name,
        shift.status,
        shift.call_time,
        shift.role,
        shift.venue,
        shift.created_at,
        now,
      ]
    );
  } catch (error) {
    console.error('[Database] Cache shift error:', error);
    throw error;
  }
};

/**
 * Get cached shift
 */
export const getCachedShift = async (shiftId: string): Promise<CachedShift | null> => {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = await db.getFirstAsync<CachedShift>(
      'SELECT * FROM shifts WHERE id = ?',
      [shiftId]
    );
    return result || null;
  } catch (error) {
    console.error('[Database] Get cached shift error:', error);
    return null;
  }
};

/**
 * Get all cached shifts
 */
export const getAllCachedShifts = async (status?: string): Promise<CachedShift[]> => {
  if (!db) throw new Error('Database not initialized');

  try {
    let query = 'SELECT * FROM shifts ORDER BY call_time DESC';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    const results = await db.allAsync<CachedShift>(query, params);
    return results || [];
  } catch (error) {
    console.error('[Database] Get all cached shifts error:', error);
    return [];
  }
};

/**
 * Cache run sheet
 */
export const cacheRunSheet = async (runSheet: CachedRunSheet): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  try {
    const now = new Date().toISOString();
    await db.runAsync(
      `
      INSERT OR REPLACE INTO run_sheets
      (id, booking_id, content, created_at, synced)
      VALUES (?, ?, ?, ?, ?)
      `,
      [runSheet.id, runSheet.booking_id, runSheet.content, now, 0]
    );
  } catch (error) {
    console.error('[Database] Cache run sheet error:', error);
    throw error;
  }
};

/**
 * Get cached run sheet
 */
export const getCachedRunSheet = async (bookingId: string): Promise<CachedRunSheet | null> => {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = await db.getFirstAsync<CachedRunSheet>(
      'SELECT * FROM run_sheets WHERE booking_id = ?',
      [bookingId]
    );
    return result || null;
  } catch (error) {
    console.error('[Database] Get cached run sheet error:', error);
    return null;
  }
};

/**
 * Store pending check-in (for offline support)
 */
export const storePendingCheckIn = async (checkIn: CachedCheckIn): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  try {
    const now = new Date().toISOString();
    await db.runAsync(
      `
      INSERT INTO check_ins
      (id, shift_id, latitude, longitude, timestamp, photo_uri, synced, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        checkIn.id,
        checkIn.shift_id,
        checkIn.latitude,
        checkIn.longitude,
        checkIn.timestamp,
        checkIn.photo_uri || null,
        0,
        now,
      ]
    );
  } catch (error) {
    console.error('[Database] Store pending check-in error:', error);
    throw error;
  }
};

/**
 * Get unsynced check-ins
 */
export const getUnsyncedCheckIns = async (): Promise<CachedCheckIn[]> => {
  if (!db) throw new Error('Database not initialized');

  try {
    const results = await db.allAsync<CachedCheckIn>(
      'SELECT * FROM check_ins WHERE synced = 0 ORDER BY created_at ASC'
    );
    return results || [];
  } catch (error) {
    console.error('[Database] Get unsynced check-ins error:', error);
    return [];
  }
};

/**
 * Mark check-in as synced
 */
export const markCheckInSynced = async (checkInId: string): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  try {
    await db.runAsync('UPDATE check_ins SET synced = 1 WHERE id = ?', [checkInId]);
  } catch (error) {
    console.error('[Database] Mark check-in synced error:', error);
    throw error;
  }
};

/**
 * Store pending action (for retry logic)
 */
export const storePendingAction = async (
  actionType: string,
  entityId: string,
  payload: any
): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  try {
    const id = `${actionType}_${entityId}_${Date.now()}`;
    const now = new Date().toISOString();
    await db.runAsync(
      `
      INSERT INTO pending_actions
      (id, action_type, entity_id, payload, created_at, synced)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [id, actionType, entityId, JSON.stringify(payload), now, 0]
    );
  } catch (error) {
    console.error('[Database] Store pending action error:', error);
    throw error;
  }
};

/**
 * Get unsynced actions
 */
export const getUnsyncedActions = async (): Promise<any[]> => {
  if (!db) throw new Error('Database not initialized');

  try {
    const results = await db.allAsync(
      'SELECT * FROM pending_actions WHERE synced = 0 ORDER BY created_at ASC'
    );
    return results?.map((r: any) => ({
      ...r,
      payload: JSON.parse(r.payload),
    })) || [];
  } catch (error) {
    console.error('[Database] Get unsynced actions error:', error);
    return [];
  }
};

/**
 * Mark action as synced
 */
export const markActionSynced = async (actionId: string): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  try {
    await db.runAsync('UPDATE pending_actions SET synced = 1 WHERE id = ?', [actionId]);
  } catch (error) {
    console.error('[Database] Mark action synced error:', error);
    throw error;
  }
};

/**
 * Clear old cached data
 */
export const clearOldCache = async (daysOld: number = 7): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffDateStr = cutoffDate.toISOString();

    await db.runAsync(
      'DELETE FROM shifts WHERE created_at < ?',
      [cutoffDateStr]
    );

    await db.runAsync(
      'DELETE FROM run_sheets WHERE created_at < ? AND synced = 1',
      [cutoffDateStr]
    );

    console.log('[Database] Cleared old cache entries');
  } catch (error) {
    console.error('[Database] Clear old cache error:', error);
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    try {
      await db.closeAsync();
      db = null;
      console.log('[Database] Connection closed');
    } catch (error) {
      console.error('[Database] Close error:', error);
    }
  }
};
