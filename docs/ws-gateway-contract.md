# WebSocket Gateway Contract

This document defines the stable websocket contract for backend/frontend collaboration based on the actual implementation in `backend/src/gateway/events.gateway.ts`.

## Connection & Authentication

### WebSocket Server Configuration
- **CORS**: Enabled for all origins with credentials support
- **Methods**: GET, POST
- **Protocol**: Socket.IO over WebSocket

### Authentication Flow
JWT token must be provided in one of these locations (checked in order):
1. `socket.handshake.auth.token`
2. `socket.handshake.headers.authorization` 
3. `socket.handshake.query.token`

#### JWT Requirements
- **Algorithm**: HS256
- **Secret**: Configured via `JWT_SECRET` environment variable
- **Validation**: Signature verification + expiration check
- **Payload Structure**:
  ```typescript
  interface WsJwtPayload {
    sub?: string;        // User ID (required for room access)
    userId?: string;     // Alternative user ID field
    exp?: number;        // Expiration timestamp
    iat?: number;        // Issued at timestamp
    [key: string]: unknown;
  }
  ```

#### Authentication Process
1. Token extracted from handshake
2. JWT format and signature validated
3. Expiration checked
4. On success: `client.data.user` set to decoded payload
5. On failure: Connection immediately rejected with `client.disconnect(true)`

## Room Management

### Room Format
- **Pattern**: `split:<splitId>`
- **Scope**: Room-scoped operations for split collaboration
- **Authorization**: Users must pass `AuthorizationService.canAccessSplit(userId, splitId)` to join

### Room Operations
- **Join**: `client.join(room)` - Adds client to room
- **Leave**: `client.leave(room)` - Removes client from room  
- **Broadcast**: `server.to(room).emit(event, data)` - Sends to all room members

## Client-to-Server Events

All client events require JWT authentication and use `WsJwtAuthGuard`.

### `join_split`
**Purpose**: Join a split's collaboration room

**Payload Schema**:
```typescript
interface JoinSplitPayload {
  splitId: string;  // Required
}
```

**Validation**:
- `splitId` is required
- User must have access to the split via `AuthorizationService.canAccessSplit()`

**Response Schema**:
```typescript
interface JoinedSplitEvent {
  splitId: string;
  room: string;     // "split:<splitId>"
}

interface WsHandlerResponse<T> {
  event: "joined_split";
  data: JoinedSplitEvent;
}
```

**Error Cases**:
- `400 Bad Request`: Missing or invalid `splitId`
- `401 Unauthorized`: Not authenticated or no access to split

### `leave_split`
**Purpose**: Leave a split's collaboration room

**Payload Schema**:
```typescript
interface LeaveSplitPayload {
  splitId: string;  // Required
}
```

**Response Schema**:
```typescript
interface LeftSplitEvent {
  splitId: string;
  room: string;     // "split:<splitId>"
}

interface WsHandlerResponse<T> {
  event: "left_split";
  data: LeftSplitEvent;
}
```

**Error Cases**:
- `400 Bad Request`: Missing or invalid `splitId`

### `split_presence`
**Purpose**: Get list of participants currently in a split room

**Payload Schema**:
```typescript
interface SplitPresencePayload {
  splitId: string;  // Required
}
```

**Response Schema**:
```typescript
interface SplitPresenceEvent {
  splitId: string;
  participants: string[];  // Array of socket IDs
}

interface WsHandlerResponse<T> {
  event: "split_presence";
  data: SplitPresenceEvent;
}
```

**Error Cases**:
- `400 Bad Request`: Missing or invalid `splitId`

### `split_activity`
**Purpose**: Broadcast activity to all participants in a split room

**Payload Schema**:
```typescript
interface SplitActivityPayload {
  splitId: string;
  activity: SplitActivityData;
}

interface SplitActivityData {
  type?: string;           // Activity type
  action?: string;         // Action performed
  actorId?: string;        // User who performed action
  description?: string;    // Human-readable description
  metadata?: Record<string, unknown>;  // Additional data
  timestamp?: string;       // ISO timestamp
  amount?: number;          // Monetary amount if applicable
  [key: string]: unknown;   // Extensible properties
}
```

**Response Schema**:
```typescript
interface SplitActivityBroadcastEvent {
  splitId: string;
  activity: SplitActivityData;
}

interface WsHandlerResponse<T> {
  event: "split_activity_broadcast";
  data: SplitActivityBroadcastEvent;
}
```

**Broadcast**: Also emits `split_activity` event to all room members with same payload

**Error Cases**:
- `400 Bad Request`: Missing `splitId` or `activity`

## Server-to-Client Events

These events are emitted by the server to clients in specific split rooms.

### `payment_received`
**Trigger**: When a payment is processed for a split

**Payload Schema**:
```typescript
interface PaymentReceivedEvent {
  splitId?: string;        // Split ID (optional, set by emitter)
  paymentId?: string;      // Payment identifier
  participantId?: string;  // Who made the payment
  type?: string;           // Payment type
  amount?: number;         // Payment amount
  currency?: string;       // Currency code
  txHash?: string;         // Transaction hash
  asset?: string;          // Asset type
  timestamp?: string;      // ISO timestamp
  [key: string]: unknown;  // Extensible properties
}
```

### `split_updated`
**Trigger**: When split properties change

**Payload Schema**:
```typescript
interface SplitUpdatedEvent {
  splitId?: string;           // Split ID (optional, set by emitter)
  type?: string;             // Update type
  status?: string;           // New status
  changes?: Record<string, unknown>;  // Changed properties
  updatedAt?: string;        // ISO timestamp
  timestamp?: string;        // ISO timestamp
  amountPaid?: number;       // Total amount paid
  paymentId?: string;        // Related payment ID
  participantId?: string;    // Related participant
  [key: string]: unknown;    // Extensible properties
}
```

### `participant_joined`
**Trigger**: When a new participant joins a split

**Payload Schema**:
```typescript
interface ParticipantJoinedEvent {
  splitId?: string;        // Split ID (optional, set by emitter)
  participantId: string;   // Participant ID (required)
  userId?: string;         // User ID
  joinedAt?: string;       // ISO timestamp
  amountOwed?: number;     // Amount owed by participant
  status?: string;         // Participant status
  timestamp?: string;      // ISO timestamp
  [key: string]: unknown;  // Extensible properties
}
```

### `split_activity`
**Trigger**: When a client broadcasts activity via `split_activity` event

**Payload Schema**: Same as `SplitActivityData` from client events
```typescript
{
  splitId: string;
  activity: SplitActivityData;
}
```

## Error Handling

### Connection Errors
- **Authentication Failure**: Connection immediately terminated
- **Invalid JWT Format**: Connection immediately terminated
- **Expired Token**: Connection immediately terminated

### Message Errors
- **Validation Errors**: `400 Bad Request` with descriptive message
- **Authorization Errors**: `401 Unauthorized` for protected operations
- **Missing Required Fields**: `400 Bad Request` specifying missing field

### Error Response Format
Errors are handled by Socket.IO's built-in error mechanism and will trigger the client's error handlers.

## Implementation Notes

### Security
- All client events require valid JWT authentication
- Room access is validated via `AuthorizationService.canAccessSplit()`
- JWT signature verification uses timing-safe comparison
- CORS is configured for cross-origin requests

### Performance
- Room operations use Socket.IO's efficient adapter
- Broadcast operations are room-scoped to minimize traffic
- Connection validation happens once during handshake

### Extensibility
- All event interfaces use `[key: string]: unknown` for future extensibility
- Activity data is flexible to support various use cases
- Server events can include additional metadata as needed

## Frontend Integration

The frontend should use this contract as the canonical reference for:
- WebSocket connection establishment
- Event payload structures
- Error handling expectations
- Room management patterns

For detailed request/response examples, see `docs/ws-event-examples.md`.
