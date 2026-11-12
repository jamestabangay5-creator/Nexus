/**
 * Nexus Offline-First Storage & Synchronization Service
 * 
 * Provides robust multi-layer persistence using IndexedDB with LocalStorage fallbacks:
 * 1. User Profile Avatar Store: Permanently preserves user uploaded photos/avatars
 *    so they never exceed LocalStorage 5MB quota or disappear upon refresh/re-login.
 * 2. Offline Incident Queue: Caches incident reports and updates created while offline
 *    and seamlessly drains/syncs to Cloud Firestore when internet connectivity restores.
 * 3. Offline Reports Mirror: Local mirror of emergency dossiers ensuring 100% offline availability.
 */

import { IncidentReport, UserProfile } from '../types';

const DB_NAME = 'nexus_emergency_offline_db';
const DB_VERSION = 1;

export interface QueuedOfflineAction {
  id: string;
  type: 'submit_report' | 'update_status' | 'reject_report';
  payload: any;
  createdAt: string;
  retryCount: number;
}

/**
 * Initialize and open IndexedDB
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. User Avatars Store (keyed by user ID, email, or 'current')
      if (!db.objectStoreNames.contains('avatars')) {
        db.createObjectStore('avatars', { keyPath: 'key' });
      }

      // 2. Offline Action Queue for automatic cloud synchronization
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'id' });
      }

      // 3. Offline Reports Cache
      if (!db.objectStoreNames.contains('reports_cache')) {
        db.createObjectStore('reports_cache', { keyPath: 'id' });
      }

      // 4. Resident User Profile Store
      if (!db.objectStoreNames.contains('user_profiles')) {
        db.createObjectStore('user_profiles', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==========================================
// AVATAR PERMANENT PERSISTENCE
// ==========================================

/**
 * Save user avatar permanently to IndexedDB and LocalStorage fallback
 */
export async function persistUserAvatar(key: string, email: string | undefined, avatarDataUrl: string): Promise<void> {
  if (!avatarDataUrl) return;

  const timestamp = new Date().toISOString();
  const keysToSave = new Set<string>(['current']);
  if (key) keysToSave.add(key.trim().toLowerCase());
  if (email) keysToSave.add(email.trim().toLowerCase());

  // 1. Save to IndexedDB (virtually unlimited quota)
  try {
    const db = await openDatabase();
    const tx = db.transaction('avatars', 'readwrite');
    const store = tx.objectStore('avatars');

    for (const k of keysToSave) {
      store.put({ key: k, avatarUrl: avatarDataUrl, updatedAt: timestamp });
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB avatar save warning:', err);
  }

  // 2. Save to LocalStorage as instant synchronous fallback
  try {
    for (const k of keysToSave) {
      localStorage.setItem(`nexus_avatar_${k}`, avatarDataUrl);
    }
    localStorage.setItem('nexus_current_avatar', avatarDataUrl);
  } catch (err) {
    // If LocalStorage quota is exceeded, IndexedDB already holds the data
    console.warn('LocalStorage avatar quota notice (safely stored in IndexedDB):', err);
  }
}

/**
 * Retrieve user avatar permanently from IndexedDB or LocalStorage
 */
export async function retrieveUserAvatar(key?: string, email?: string): Promise<string | null> {
  const candidateKeys = [
    key?.trim().toLowerCase(),
    email?.trim().toLowerCase(),
    'current',
  ].filter(Boolean) as string[];

  // 1. Try IndexedDB first
  try {
    const db = await openDatabase();
    const tx = db.transaction('avatars', 'readonly');
    const store = tx.objectStore('avatars');

    for (const k of candidateKeys) {
      const result = await new Promise<{ key: string; avatarUrl: string } | undefined>((resolve) => {
        const req = store.get(k);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(undefined);
      });

      if (result && result.avatarUrl) {
        return result.avatarUrl;
      }
    }
  } catch (err) {
    console.warn('IndexedDB avatar lookup warning:', err);
  }

  // 2. Try LocalStorage fallback
  try {
    for (const k of candidateKeys) {
      const stored = localStorage.getItem(`nexus_avatar_${k}`);
      if (stored) return stored;
    }
    const current = localStorage.getItem('nexus_current_avatar');
    if (current) return current;
  } catch {}

  return null;
}

// ==========================================
// OFFLINE ACTIONS QUEUE & SYNC
// ==========================================

/**
 * Enqueue an operation to be automatically synced to Cloud Firestore when online
 */
export async function enqueueOfflineAction(action: Omit<QueuedOfflineAction, 'createdAt' | 'retryCount'>): Promise<void> {
  const fullAction: QueuedOfflineAction = {
    ...action,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  try {
    const db = await openDatabase();
    const tx = db.transaction('offline_queue', 'readwrite');
    tx.objectStore('offline_queue').put(fullAction);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB enqueue action error, using LocalStorage fallback:', err);
    try {
      const raw = localStorage.getItem('nexus_offline_queue_v1') || '[]';
      const queue = JSON.parse(raw);
      queue.push(fullAction);
      localStorage.setItem('nexus_offline_queue_v1', JSON.stringify(queue));
    } catch {}
  }
}

/**
 * Get all queued offline actions
 */
export async function getOfflineQueue(): Promise<QueuedOfflineAction[]> {
  const actions: QueuedOfflineAction[] = [];

  try {
    const db = await openDatabase();
    const tx = db.transaction('offline_queue', 'readonly');
    const store = tx.objectStore('offline_queue');

    const result = await new Promise<QueuedOfflineAction[]>((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
    actions.push(...result);
  } catch {
    // Fallback to LocalStorage
    try {
      const raw = localStorage.getItem('nexus_offline_queue_v1') || '[]';
      actions.push(...JSON.parse(raw));
    } catch {}
  }

  return actions;
}

/**
 * Remove an action from the offline queue after successful sync
 */
export async function removeOfflineAction(actionId: string): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('offline_queue', 'readwrite');
    tx.objectStore('offline_queue').delete(actionId);
  } catch {
    try {
      const raw = localStorage.getItem('nexus_offline_queue_v1') || '[]';
      const queue = JSON.parse(raw).filter((a: any) => a.id !== actionId);
      localStorage.setItem('nexus_offline_queue_v1', JSON.stringify(queue));
    } catch {}
  }
}

/**
 * Cache all incident reports in IndexedDB
 */
export async function cacheReportsOffline(reports: IncidentReport[]): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('reports_cache', 'readwrite');
    const store = tx.objectStore('reports_cache');
    for (const report of reports) {
      store.put(report);
    }
  } catch (err) {
    console.warn('Offline reports caching warning:', err);
  }
}

/**
 * Retrieve cached reports from IndexedDB
 */
export async function getCachedReportsOffline(): Promise<IncidentReport[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction('reports_cache', 'readonly');
    const store = tx.objectStore('reports_cache');
    return await new Promise<IncidentReport[]>((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

