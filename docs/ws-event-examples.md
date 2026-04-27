# WebSocket Event Examples

This document provides practical examples of WebSocket event interactions between frontend and backend based on the actual implementation.

## Connection Examples

### Successful Connection with JWT

```javascript
// Frontend - Socket.IO client
import { io } from 'socket.io-client';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // JWT token

const socket = io('ws://localhost:4000', {
  auth: {
    token: token
  },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected with socket ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

### Alternative Authentication Methods

```javascript
// Using Authorization header
const socket = io('ws://localhost:4000', {
  extraHeaders: {
    authorization: `Bearer ${token}`
  }
});

// Using query parameter
const socket = io(`ws://localhost:4000?token=${token}`);
```

## Client-to-Server Event Examples

### Join Split Room

**Request**:
```javascript
socket.emit('join_split', {
  splitId: 'split_12345'
});
```

**Success Response**:
```javascript
socket.on('joined_split', (response) => {
  console.log('Joined split room:', response);
  // Response: {
  //   event: "joined_split",
  //   data: {
  //     splitId: "split_12345",
  //     room: "split:split_12345"
  //   }
  // }
});
```

**Error Response**:
```javascript
socket.on('connect_error', (error) => {
  // 400 Bad Request: "splitId is required"
  // 401 Unauthorized: "Not allowed to join this split"
});
```

### Leave Split Room

**Request**:
```javascript
socket.emit('leave_split', {
  splitId: 'split_12345'
});
```

**Success Response**:
```javascript
socket.on('left_split', (response) => {
  console.log('Left split room:', response);
  // Response: {
  //   event: "left_split", 
  //   data: {
  //     splitId: "split_12345",
  //     room: "split:split_12345"
  //   }
  // }
});
```

### Get Split Presence

**Request**:
```javascript
socket.emit('split_presence', {
  splitId: 'split_12345'
});
```

**Success Response**:
```javascript
socket.on('split_presence', (response) => {
  console.log('Room participants:', response);
  // Response: {
  //   event: "split_presence",
  //   data: {
  //     splitId: "split_12345",
  //     participants: ["socket_abc123", "socket_def456", "socket_ghi789"]
  //   }
  // }
});
```

### Broadcast Split Activity

**Request**:
```javascript
socket.emit('split_activity', {
  splitId: 'split_12345',
  activity: {
    type: 'payment_initiated',
    action: 'user_paid',
    actorId: 'user_789',
    description: 'Alice paid her share of the dinner bill',
    amount: 25.50,
    currency: 'USD',
    timestamp: '2024-01-15T10:30:00Z',
    metadata: {
      paymentMethod: 'credit_card',
      restaurantName: 'The Italian Place'
    }
  }
});
```

**Success Response**:
```javascript
socket.on('split_activity_broadcast', (response) => {
  console.log('Activity broadcasted:', response);
  // Response: {
  //   event: "split_activity_broadcast",
  //   data: {
  //     splitId: "split_12345",
  //     activity: {
  //       type: "payment_initiated",
  //       action: "user_paid",
  //       actorId: "user_789",
  //       description: "Alice paid her share of the dinner bill",
  //       amount: 25.50,
  //       currency: "USD",
  //       timestamp: "2024-01-15T10:30:00Z",
  //       metadata: {
  //         paymentMethod: "credit_card",
  //         restaurantName: "The Italian Place"
  //       }
  //     }
  //   }
  // }
});
```

**Broadcast to Room Members**:
```javascript
// All clients in the room receive this
socket.on('split_activity', (data) => {
  console.log('New activity in split:', data);
  // Data: {
  //   splitId: "split_12345",
  //   activity: { /* same activity object as above */ }
  // }
});
```

## Server-to-Client Event Examples

### Payment Received Event

```javascript
socket.on('payment_received', (data) => {
  console.log('Payment received:', data);
  // Example data: {
  //   splitId: "split_12345",
  //   paymentId: "pay_xyz789",
  //   participantId: "user_789",
  //   type: "partial_payment",
  //   amount: 25.50,
  //   currency: "USD",
  //   txHash: "0xabcdef123456789...",
  //   asset: "USDC",
  //   timestamp: "2024-01-15T10:30:00Z"
  // }
});
```

### Split Updated Event

```javascript
socket.on('split_updated', (data) => {
  console.log('Split updated:', data);
  // Example data: {
  //   splitId: "split_12345",
  //   type: "status_change",
  //   status: "partially_paid",
  //   changes: {
  //     amountPaid: 25.50,
  //     remainingAmount: 74.50
  //   },
  //   updatedAt: "2024-01-15T10:30:00Z",
  //   timestamp: "2024-01-15T10:30:00Z",
  //   paymentId: "pay_xyz789",
  //   participantId: "user_789"
  // }
});
```

### Participant Joined Event

```javascript
socket.on('participant_joined', (data) => {
  console.log('New participant joined:', data);
  // Example data: {
  //   splitId: "split_12345",
  //   participantId: "participant_456",
  //   userId: "user_456",
  //   joinedAt: "2024-01-15T10:25:00Z",
  //   amountOwed: 35.00,
  //   status: "active",
  //   timestamp: "2024-01-15T10:25:00Z"
  // }
});
```

## Complete Integration Example

```javascript
import { io } from 'socket.io-client';

class SplitWebSocketClient {
  constructor(token, serverUrl = 'ws://localhost:4000') {
    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket']
    });
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    // Split room events
    this.socket.on('joined_split', (response) => {
      console.log('Successfully joined split room:', response.data);
    });

    this.socket.on('left_split', (response) => {
      console.log('Successfully left split room:', response.data);
    });

    this.socket.on('split_presence', (response) => {
      console.log('Room participants:', response.data.participants);
    });

    this.socket.on('split_activity_broadcast', (response) => {
      console.log('Activity broadcast confirmed:', response.data);
    });

    // Server broadcast events
    this.socket.on('payment_received', (data) => {
      this.handlePaymentReceived(data);
    });

    this.socket.on('split_updated', (data) => {
      this.handleSplitUpdated(data);
    });

    this.socket.on('participant_joined', (data) => {
      this.handleParticipantJoined(data);
    });

    this.socket.on('split_activity', (data) => {
      this.handleSplitActivity(data);
    });

    // Error handling
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });
  }

  async joinSplit(splitId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('join_split', { splitId });
      
      const timeout = setTimeout(() => {
        reject(new Error('Join split timeout'));
      }, 5000);

      this.socket.once('joined_split', (response) => {
        clearTimeout(timeout);
        resolve(response);
      });

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async leaveSplit(splitId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('leave_split', { splitId });
      
      const timeout = setTimeout(() => {
        reject(new Error('Leave split timeout'));
      }, 5000);

      this.socket.once('left_split', (response) => {
        clearTimeout(timeout);
        resolve(response);
      });

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async getSplitPresence(splitId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('split_presence', { splitId });
      
      const timeout = setTimeout(() => {
        reject(new Error('Get presence timeout'));
      }, 5000);

      this.socket.once('split_presence', (response) => {
        clearTimeout(timeout);
        resolve(response);
      });

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  broadcastActivity(splitId, activity) {
    this.socket.emit('split_activity', {
      splitId,
      activity: {
        ...activity,
        timestamp: activity.timestamp || new Date().toISOString()
      }
    });
  }

  // Event handlers
  handlePaymentReceived(data) {
    console.log('💰 Payment received:', data);
    // Update UI with new payment status
  }

  handleSplitUpdated(data) {
    console.log('📝 Split updated:', data);
    // Refresh split data in UI
  }

  handleParticipantJoined(data) {
    console.log('👤 New participant:', data);
    // Add new participant to UI
  }

  handleSplitActivity(data) {
    console.log('🔄 Split activity:', data);
    // Show activity feed update
  }
}

// Usage example
const client = new SplitWebSocketClient('your-jwt-token');

// Join a split room
client.joinSplit('split_12345')
  .then(() => {
    console.log('Successfully joined split room');
    
    // Get current participants
    return client.getSplitPresence('split_12345');
  })
  .then(presence => {
    console.log('Current participants:', presence.data.participants);
    
    // Broadcast an activity
    client.broadcastActivity('split_12345', {
      type: 'comment_added',
      action: 'user_commented',
      actorId: 'user_123',
      description: 'Added a comment to the split'
    });
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

## Error Handling Examples

### Authentication Error

```javascript
socket.on('connect_error', (error) => {
  if (error.message.includes('Unauthorized')) {
    console.log('Authentication failed - redirect to login');
    // Redirect to login page
  }
});
```

### Validation Error

```javascript
socket.on('connect_error', (error) => {
  if (error.message.includes('Bad Request')) {
    console.log('Invalid request format:', error.message);
    // Show validation error to user
  }
});
```

### Room Access Error

```javascript
socket.emit('join_split', { splitId: 'unauthorized_split' });

socket.on('connect_error', (error) => {
  if (error.message.includes('Not allowed to join this split')) {
    console.log('Access denied to split');
    // Show permission error to user
  }
});
```

## Testing Examples

### Mock Server for Testing

```javascript
// For frontend testing without backend
const mockSocket = io('ws://localhost:4000', {
  auth: { token: 'test-token' }
});

mockSocket.on('join_split', (payload, callback) => {
  // Simulate successful join
  callback({
    event: 'joined_split',
    data: {
      splitId: payload.splitId,
      room: `split:${payload.splitId}`
    }
  });
});
```

### Event Validation

```javascript
// Validate event payloads before sending
function validateJoinSplitPayload(payload) {
  if (!payload || typeof payload.splitId !== 'string' || !payload.splitId.trim()) {
    throw new Error('Invalid splitId: must be a non-empty string');
  }
  return true;
}

// Usage
try {
  validateJoinSplitPayload({ splitId: 'valid_123' });
  socket.emit('join_split', { splitId: 'valid_123' });
} catch (error) {
  console.error('Validation error:', error.message);
}
```

## Performance Considerations

### Event Throttling

```javascript
class ThrottledActivityBroadcaster {
  constructor(socket, delayMs = 1000) {
    this.socket = socket;
    this.delayMs = delayMs;
    this.lastBroadcast = 0;
    this.pendingActivity = null;
  }

  broadcastActivity(splitId, activity) {
    this.pendingActivity = { splitId, activity };
    
    if (Date.now() - this.lastBroadcast >= this.delayMs) {
      this.flushActivity();
    } else {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.flushActivity(), this.delayMs);
    }
  }

  flushActivity() {
    if (this.pendingActivity) {
      this.socket.emit('split_activity', this.pendingActivity);
      this.lastBroadcast = Date.now();
      this.pendingActivity = null;
    }
  }
}
```

### Connection Management

```javascript
class RobustWebSocketClient {
  constructor(token, serverUrl) {
    this.token = token;
    this.serverUrl = serverUrl;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    this.connect();
  }

  connect() {
    this.socket = io(this.serverUrl, {
      auth: { token: this.token },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected successfully');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected, attempting to reconnect...');
      this.attemptReconnect();
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnect attempt ${this.reconnectAttempts}`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnect attempts reached');
    }
  }
}
```

These examples provide comprehensive coverage of WebSocket event interactions and can be used directly for frontend implementation without needing to reverse-engineer the backend source code.
