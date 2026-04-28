# Realtime Analytics Pipeline Guide

This document provides comprehensive documentation for the StellarSplit realtime analytics pipeline, including ingestion, caching, query endpoints, fallbacks, and feature detection.

---

## Overview

The realtime analytics module implements a high-performance metrics pipeline using:
- **Apache Kafka** for streaming event ingestion
- **ClickHouse** for analytics storage and fast queries
- **Redis** for caching and real-time metrics
- **WebSockets** for real-time event delivery

The system is designed with graceful degradation - it continues to operate even when some services are unavailable.

---

## Architecture

```
┌─────────────────┐
│  Application    │
│  (NestJS API)    │
└────────┬────────┘
         │ trackEvent()
         ▼
┌─────────────────────────────────────────────────────────┐
│         AnalyticsIngestService                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  1. Internal Event Bus (always available)      │  │
│  │  2. Kafka Producer (if available)               │  │
│  │  3. ClickHouse Direct (if available)           │  │
│  └─────────────────────────────────────────────────┘  │
└────────────┬───────────────────────────────────────────┘
             │
             ├──► Kafka ──► Kafka Consumer ──► ClickHouse
             │
             └──► ClickHouse (direct)
                           │
                           ▼
                    ┌──────────────┐
                    │  ClickHouse   │
                    │  (Analytics)  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Redis Cache │
                    │  (10s TTL)   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Analytics   │
                    │  Controller  │
                    └──────────────┘
```

---

## Ingestion Pipeline

### Event Flow

When an analytics event is tracked via `AnalyticsIngestService.trackEvent()`:

1. **Event Creation**: Event is created with UUID, timestamp, actor, context, and payload
2. **Internal Event Bus**: Event is emitted to internal subscribers (always available)
3. **Kafka Publishing**: If Kafka is available, event is sent to `analytics-events` topic
4. **ClickHouse Storage**: If ClickHouse is available, event is stored directly
5. **Fallback**: If Kafka fails, fallback to direct ClickHouse storage

### Code Flow

```typescript
// In AnalyticsIngestService.trackEvent()
async trackEvent(type, payload, options) {
  const event = createEvent(type, payload, options);
  
  // Step 1: Always emit to internal event bus
  this.emitInternalEvent(event);
  
  // Step 2: Send to Kafka if available
  if (this.features.kafka) {
    await this.sendToKafka(event);
  }
  
  // Step 3: Store in ClickHouse if available
  if (this.features.clickhouse) {
    await this.storeInClickHouse(event);
  }
  
  return event.id;
}
```

### Kafka Configuration

```typescript
const kafka = new Kafka({
  clientId: 'analytics-ingest',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  logLevel: logLevel.ERROR,
  retry: {
    initialRetryTime: 100,
    retries: 3,
  },
});

const producer = kafka.producer({
  allowAutoTopicCreation: false,
  transactionTimeout: 30000,
});

const consumer = kafka.consumer({
  groupId: 'analytics-ingest-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});
```

### Kafka Topic

- **Topic Name**: `analytics-events`
- **Message Format**: JSON
- **Key**: Event UUID
- **Headers**: `eventType`

---

## Caching Strategy

### Redis Caching

Redis is used to cache platform metrics for fast access:

```typescript
// Cache metrics with 10-second TTL
await redis.set('platform_metrics', JSON.stringify(metric), 'EX', 10);

// Retrieve cached metrics
const data = await redis.get('platform_metrics');
return data ? JSON.parse(data) : null;
```

### Cache Configuration

- **Key**: `platform_metrics`
- **TTL**: 10 seconds (for real-time freshness)
- **Format**: JSON string
- **Purpose**: Fast dashboard queries without hitting ClickHouse

### Cache Strategy Rationale

- **Short TTL (10s)**: Ensures real-time metrics while reducing ClickHouse load
- **Single Key**: Simplifies cache invalidation
- **JSON Format**: Easy serialization/deserialization
- **Fallback**: If Redis unavailable, queries go directly to ClickHouse

---

## Query Endpoints

The analytics controller provides several query endpoints for dashboards and analytics:

### Health Check

**Endpoint**: `GET /analytics/health`

**Response**:
```json
{
  "operational": true,
  "features": {
    "kafka": true,
    "clickhouse": true,
    "redis": true
  },
  "timestamp": "2026-04-28T10:00:00.000Z"
}
```

### Metrics Query

**Endpoint**: `GET /analytics/metrics`

**Query Parameters**:
- `dateFrom` (optional): ISO date string
- `dateTo` (optional): ISO date string
- `eventType` (optional): Event type filter

**Default**: Last 7 days

**Example**:
```bash
GET /analytics/metrics?dateFrom=2026-04-21&dateTo=2026-04-28&eventType=split.created
```

### Funnel Analysis

**Endpoint**: `POST /analytics/funnel`

**Request Body**:
```json
{
  "eventTypes": ["user.registered", "split.created", "payment.completed"],
  "dateFrom": "2026-04-01",
  "dateTo": "2026-04-28"
}
```

**Response**: Conversion rates between funnel steps

### Retention Analysis

**Endpoint**: `GET /analytics/retention`

**Query Parameters**:
- `eventType` (optional): Event type for cohort
- `startDate` (optional): Cohort start date
- `periods` (optional): Number of periods (1-90)

**Default**: Last 30 days, 7 periods

### Trends Query

**Endpoint**: `GET /analytics/trends`

**Query Parameters**:
- `eventTypes` (optional): Array of event types
- `dateFrom` (optional): ISO date string
- `dateTo` (optional): ISO date string
- `interval` (optional): `hour`, `day`, `week`, `month`

**Default**: Last 7 days, `split.created`, daily interval

### Daily Summary

**Endpoint**: `GET /analytics/dashboard/daily`

**Query Parameters**:
- `date` (optional): ISO date string

**Default**: Today

**Response**: Daily metrics summary for dashboard

---

## Fallbacks and Feature Detection

### Feature Detection

The service tracks availability of each component:

```typescript
private features = {
  kafka: false,      // Kafka streaming
  clickhouse: false, // ClickHouse storage
  redis: true,       // Redis caching
};
```

Features are checked during initialization:

```typescript
async initializeConnections() {
  // Try to connect to Kafka
  if (this.configService.get('KAFKA_BROKERS')) {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.features.kafka = true;
    } catch (error) {
      this.logger.warn('Failed to connect to Kafka, using fallback mode');
    }
  }

  // Verify ClickHouse connection
  await this.verifyClickHouse();

  // Verify Redis connection
  await this.verifyRedis();
}
```

### Fallback Behavior

#### Kafka Unavailable

- Events are emitted to internal event bus
- Events are stored directly in ClickHouse
- No data loss, but no async processing

#### ClickHouse Unavailable

- Events are emitted to internal event bus
- Events are sent to Kafka (if available)
- Query endpoints return fallback metrics:
```json
{
  "date": "2026-04-28",
  "available": false,
  "message": "Analytics storage temporarily unavailable"
}
```

#### Redis Unavailable

- No caching, queries go directly to ClickHouse
- Slightly slower response times
- No data loss

### Graceful Degradation

The system is designed to operate with any combination of available services:

| Kafka | ClickHouse | Redis | Behavior |
|-------|-----------|-------|----------|
| ✓ | ✓ | ✓ | Full functionality |
| ✗ | ✓ | ✓ | Direct storage, no async processing |
| ✓ | ✗ | ✓ | Kafka only, no queries |
| ✗ | ✗ | ✓ | Internal events only |
| ✓ | ✓ | ✗ | No caching, slower queries |
| ✗ | ✓ | ✗ | Direct storage, no caching |
| ✓ | ✗ | ✗ | Kafka only, no queries/caching |
| ✗ | ✗ | ✗ | Internal events only |

---

## ClickHouse Schema

### Table: analytics_events

```sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id String,
  type Enum8(
    'split.created' = 1,
    'split.updated' = 2,
    'split.completed' = 3,
    'split.deleted' = 4,
    'split.shared' = 5,
    'item.added' = 6,
    'item.updated' = 7,
    'item.deleted' = 8,
    'payment.initiated' = 9,
    'payment.completed' = 10,
    'payment.failed' = 11,
    'payment.refunded' = 12,
    'participant.joined' = 13,
    'participant.left' = 14,
    'participant.settled' = 15,
    'user.registered' = 16,
    'user.login' = 17,
    'user.logout' = 18,
    'user.profile.updated' = 19,
    'search.performed' = 20,
    'filter.applied' = 21,
    'page.viewed' = 22,
    'button.clicked' = 23,
    'error.occurred' = 24
  ),
  timestamp DateTime64(3),
  
  -- Actor fields
  actor_user_id Nullable(String),
  actor_session_id Nullable(String),
  actor_ip_address Nullable(String),
  actor_user_agent Nullable(String),
  
  -- Context fields
  context_source Nullable(String),
  context_platform Nullable(String),
  context_version Nullable(String),
  context_locale Nullable(String),
  
  -- Payload (JSON)
  payload String,
  
  -- Resource fields
  resource_type Nullable(String),
  resource_id Nullable(String),
  
  -- Processing metadata
  processed_at Nullable(DateTime64(3))
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (type, timestamp, id)
TTL timestamp + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;
```

### Key Design Decisions

- **MergeTree Engine**: Optimized for append-only analytics workloads
- **Partition by Month**: Efficient time-based queries and data management
- **Order by (type, timestamp, id)**: Fast filtering and sorting
- **TTL 90 days**: Automatic cleanup of old data
- **Enum8 for type**: Efficient storage of event types

---

## Event Types

### Split Events
- `split.created` - New split created
- `split.updated` - Split details updated
- `split.completed` - Split marked complete
- `split.deleted` - Split deleted
- `split.shared` - Split shared with participants

### Item Events
- `item.added` - Item added to split
- `item.updated` - Item details updated
- `item.deleted` - Item removed from split

### Payment Events
- `payment.initiated` - Payment started
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed
- `payment.refunded` - Payment refunded

### Participant Events
- `participant.joined` - Participant joined split
- `participant.left` - Participant left split
- `participant.settled` - Participant settled their portion

### User Events
- `user.registered` - New user registered
- `user.login` - User logged in
- `user.logout` - User logged out
- `user.profile.updated` - Profile updated

### Discovery Events
- `search.performed` - Search query executed
- `filter.applied` - Filter applied to results

### Engagement Events
- `page.viewed` - Page viewed
- `button.clicked` - Button clicked
- `error.occurred` - Error occurred

---

## Environment Variables

### Required for Full Functionality

```env
# Kafka
KAFKA_BROKERS=localhost:9092

# ClickHouse
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DB=analytics

# Redis
REDIS_URL=redis://localhost:6379
```

### Optional

```env
# If not set, features will be disabled gracefully
# KAFKA_BROKERS
# CLICKHOUSE_HOST
# REDIS_URL
```

---

## Deployment Dependencies

### Production Requirements

For full analytics functionality in production:

1. **Kafka Cluster**
   - 3+ brokers for high availability
   - Replication factor: 3
   - Topic: `analytics-events` (partitions: 6, replication: 3)

2. **ClickHouse Server**
   - Replicated cluster for HA
   - Sufficient disk space for 90-day retention
   - Configured with proper merge settings

3. **Redis**
   - Redis Cluster or Sentinel for HA
   - Sufficient memory for cache

### Minimum Viable Setup

For development or minimal production:

- PostgreSQL only (no analytics queries)
- Or: ClickHouse single instance (no Kafka/Redis)
- System will degrade gracefully based on available services

---

## Monitoring

### Health Check

Monitor `/analytics/health` endpoint to check:
- Service operational status
- Feature availability
- Connection status

### Metrics to Monitor

- Kafka consumer lag
- ClickHouse query latency
- Redis cache hit rate
- Event ingestion rate
- Query success rate

### Alerts

Set up alerts for:
- Kafka consumer lag > 1000 messages
- ClickHouse query latency > 5s
- Redis connection failures
- ClickHouse connection failures
- Event ingestion failures

---

## Testing

### Unit Tests

Run unit tests for analytics module:

```bash
cd backend
npm test -- src/realtime-analytics/analytics.test.ts
```

### Integration Tests

Test with local services:

```bash
# Start services
docker-compose up -d kafka clickhouse redis

# Run integration tests
npm test -- test/analytics.e2e.spec.ts
```

### Manual Testing

Test ingestion:

```bash
curl -X POST http://localhost:3000/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "split.created",
    "payload": {"splitId": "test-123"},
    "userId": "user-456"
  }'
```

Test query:

```bash
curl http://localhost:3000/analytics/metrics?dateFrom=2026-04-21
```

---

## Performance Considerations

### ClickHouse Optimization

- Use materialized views for pre-aggregated metrics
- Partition by month for efficient time-range queries
- Set appropriate TTL for data retention
- Monitor merge performance

### Kafka Optimization

- Use appropriate partition count (6 for analytics)
- Configure consumer lag monitoring
- Batch events for higher throughput
- Use compression for large payloads

### Redis Optimization

- Monitor cache hit rate
- Adjust TTL based on freshness requirements
- Use Redis Cluster for high throughput
- Monitor memory usage

---

## Troubleshooting

### High Kafka Consumer Lag

**Symptoms**: Events not being processed quickly

**Solutions**:
- Increase consumer count
- Check for slow ClickHouse inserts
- Verify consumer is not stuck
- Check network bandwidth

### ClickHouse Query Slow

**Symptoms**: Analytics queries taking > 5s

**Solutions**:
- Check for missing indexes
- Verify partition pruning is working
- Check for long-running merges
- Consider materialized views

### Redis Connection Failures

**Symptoms**: Cache misses, high latency

**Solutions**:
- Verify Redis is running
- Check connection string
- Monitor Redis memory
- Check for network issues

### Events Not Stored

**Symptoms**: Events tracked but not appearing in queries

**Solutions**:
- Check `/analytics/health` for feature status
- Verify ClickHouse connection
- Check Kafka producer errors
- Review service logs

---

## Future Enhancements

- Add materialized views for common aggregations
- Implement real-time dashboard via WebSockets
- Add anomaly detection for unusual patterns
- Implement data export functionality
- Add user-level analytics dashboards
- Implement A/B testing analytics

---

## Related Documentation

- [Backend Developer Guide](../backend/dev-guide.md)
- [Backend Architecture](../backend/docs/architecture.md)
- [API Documentation](../docs/API.md)

---

Last Updated: 2026-04-28
