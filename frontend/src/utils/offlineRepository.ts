/**
 * offlineRepository.ts — Issue #490
 *
 * Typed offline repository for splits and queued payments.
 * Replaces the `any`-based helpers in indexedDB.ts with store-specific
 * typed methods and handles schema migration from v1 → v2.
 */

import { openDB, type IDBPDatabase } from 'idb';
import {
  DB_NAME,
  DB_VERSION,
  STORES,
  type OfflineSplit,
  type QueuedPayment,
} from '../types/offline';

// ── Database singleton ─────────────────────────────────────────────────────────

let _db: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (_db) return _db;

  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // v1 → create initial stores (preserved for migration from v1)
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORES.splits)) {
          db.createObjectStore(STORES.splits, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.queuedPayments)) {
          db.createObjectStore(STORES.queuedPayments, { keyPath: 'id' });
        }
      }

      // v2 → ensure stores exist if upgrading from an older schema
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORES.splits)) {
          db.createObjectStore(STORES.splits, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.queuedPayments)) {
          db.createObjectStore(STORES.queuedPayments, { keyPath: 'id' });
        }
      }
    },
  });

  return _db;
}

// ── Split repository ───────────────────────────────────────────────────────────

export const splitRepository = {
  async save(split: OfflineSplit): Promise<void> {
    const db = await getDb();
    await db.put(STORES.splits, split);
  },

  async get(id: string): Promise<OfflineSplit | undefined> {
    const db = await getDb();
    return db.get(STORES.splits, id);
  },

  async getAll(): Promise<OfflineSplit[]> {
    const db = await getDb();
    return db.getAll(STORES.splits);
  },

  async getPendingSync(): Promise<OfflineSplit[]> {
    const all = await splitRepository.getAll();
    return all.filter((s) => s.pendingSync);
  },

  async markSynced(id: string): Promise<void> {
    const db = await getDb();
    const split = await db.get(STORES.splits, id) as OfflineSplit | undefined;
    if (split) {
      await db.put(STORES.splits, { ...split, pendingSync: false });
    }
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORES.splits, id);
  },

  async clear(): Promise<void> {
    const db = await getDb();
    await db.clear(STORES.splits);
  },
};

// ── Queued payment repository ─────────────────────────────────────────────────

export const queuedPaymentRepository = {
  async enqueue(payment: QueuedPayment): Promise<void> {
    const db = await getDb();
    await db.put(STORES.queuedPayments, payment);
  },

  async get(id: string): Promise<QueuedPayment | undefined> {
    const db = await getDb();
    return db.get(STORES.queuedPayments, id);
  },

  async getAll(): Promise<QueuedPayment[]> {
    const db = await getDb();
    return db.getAll(STORES.queuedPayments);
  },

  async recordAttempt(id: string, error?: string): Promise<void> {
    const db = await getDb();
    const payment = await db.get(STORES.queuedPayments, id) as QueuedPayment | undefined;
    if (payment) {
      await db.put(STORES.queuedPayments, {
        ...payment,
        attempts: payment.attempts + 1,
        lastError: error,
      });
    }
  },

  async dequeue(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORES.queuedPayments, id);
  },

  async clear(): Promise<void> {
    const db = await getDb();
    await db.clear(STORES.queuedPayments);
  },
};
