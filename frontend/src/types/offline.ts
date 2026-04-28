/**
 * offline.ts — Issue #490
 * Typed record shapes for offline split and queued-payment storage.
 */

export interface OfflineSplit {
  id: string;
  title: string;
  currency: string;
  totalAmount: number;
  participants: Array<{ id: string; name: string; amountOwed: number }>;
  createdAt: string;
  updatedAt: string;
  /** True when this record has not yet been synced to the server. */
  pendingSync: boolean;
}

export interface QueuedPayment {
  id: string;
  splitId: string;
  /** Stellar public key of the destination. */
  destination: string;
  amount: number;
  asset: string;
  memo?: string;
  /** ISO timestamp when the payment was queued. */
  queuedAt: string;
  /** Number of submission attempts. */
  attempts: number;
  lastError?: string;
}

export const DB_NAME = 'stellar-split-db';
export const DB_VERSION = 2;

export const STORES = {
  splits: 'splits',
  queuedPayments: 'queuedPayments',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];
