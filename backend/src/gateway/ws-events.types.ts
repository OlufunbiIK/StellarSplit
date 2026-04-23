// ── Inbound message payloads ──────────────────────────────────────────────────

export interface JoinSplitPayload {
  splitId: string;
}

export interface LeaveSplitPayload {
  splitId: string;
}

export interface SplitPresencePayload {
  splitId: string;
}

export interface SplitActivityPayload {
  splitId: string;
  activity: SplitActivityData;
}

export interface SplitActivityData {
  type?: string;
  action?: string;
  actorId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  amount?: number;
  [key: string]: unknown;
}

// ── Outbound event payloads ───────────────────────────────────────────────────
// Fields are intentionally flexible to accommodate existing callers across
// payment-processor, payment-reconciliation, payment-settlement, and
// recurring-splits services. Required fields are those present in all usages;
// everything else is optional.

export interface PaymentReceivedEvent {
  splitId: string;
  paymentId?: string;
  participantId?: string;
  type?: string;
  amount?: number;
  currency?: string;
  txHash?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface SplitUpdatedEvent {
  splitId: string;
  type?: string;
  status?: string;
  changes?: Record<string, unknown>;
  updatedAt?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ParticipantJoinedEvent {
  splitId: string;
  participantId: string;
  userId?: string;
  joinedAt?: string;
  amountOwed?: number;
  status?: string;
  timestamp?: string;
  [key: string]: unknown;
}

// ── Handler return shapes ─────────────────────────────────────────────────────

export interface JoinedSplitEvent {
  splitId: string;
  room: string;
}

export interface LeftSplitEvent {
  splitId: string;
  room: string;
}

export interface SplitPresenceEvent {
  splitId: string;
  participants: string[];
}

export interface SplitActivityBroadcastEvent {
  splitId: string;
  activity: SplitActivityData;
}

export interface WsHandlerResponse<T> {
  event: string;
  data: T;
}
