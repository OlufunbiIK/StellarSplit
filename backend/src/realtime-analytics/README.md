# Realtime Analytics Engine

This module implements real-time platform metrics using Kafka, ClickHouse, Redis, and WebSockets with graceful degradation.

## Overview

The analytics pipeline provides:

- Real-time event ingestion with streaming (Kafka)
- High-performance analytics storage (ClickHouse)
- Fast metric caching (Redis)
- Query endpoints for dashboards (REST API)
- Graceful degradation when services are unavailable

## Metrics Tracked

- **Splits per second** - Split creation rate
- **Active users** - Unique users in time window
- **Payment success rate** - Payment completion percentage
- **Average settlement time** - Time from initiation to completion
- **Geographic distribution** - User location analytics
- **Funnel conversions** - User journey analytics
- **Retention cohorts** - User retention over time
- **Event trends** - Time-series event patterns

## Technology Stack

- **Apache Kafka** (kafkajs) - Streaming event ingestion
- **ClickHouse** (@apla/clickhouse) - Analytics storage and queries
- **Redis** (ioredis) - Metrics caching
- **WebSockets** - Real-time event delivery

## Architecture

```
Application → AnalyticsIngestService → Kafka → Consumer → ClickHouse
                                          ↓
                                       Redis Cache
                                          ↓
                                   Analytics Controller
```

## Feature Detection

The service tracks availability of each component:

- `kafka` - Kafka streaming (optional)
- `clickhouse` - ClickHouse storage (optional)
- `redis` - Redis caching (optional)

The system operates with any combination of available services. See [docs/REALTIME_ANALYTICS.md](../../../docs/REALTIME_ANALYTICS.md) for details.

## Entry Points

- `analytics-ingest.service.ts` - Main service for event ingestion and queries
- `analytics.controller.ts` - REST API endpoints for analytics queries
- `analytics.ingest.ts` - Kafka consumer for metrics ingestion
- `analytics.cache.ts` - Redis caching utilities
- `analytics-events.ts` - Event types and ClickHouse schema
- `analytics.aggregate.ts` - Aggregation logic
- `analytics.websocket.ts` - WebSocket delivery
- `analytics.metrics.ts` - Metrics definitions

## API Endpoints

### Health Check

- `GET /analytics/health` - Check service status and feature availability

### Query Endpoints

- `GET /analytics/metrics` - Query metrics with filters
- `POST /analytics/funnel` - Funnel analysis
- `GET /analytics/retention` - Retention cohort analysis
- `GET /analytics/trends` - Time-series trends
- `GET /analytics/dashboard/daily` - Daily summary for dashboard

See [docs/REALTIME_ANALYTICS.md](../../../docs/REALTIME_ANALYTICS.md) for detailed API documentation.

## Event Types

### Split Events

- `split.created`, `split.updated`, `split.completed`, `split.deleted`, `split.shared`

### Item Events

- `item.added`, `item.updated`, `item.deleted`

### Payment Events

- `payment.initiated`, `payment.completed`, `payment.failed`, `payment.refunded`

### Participant Events

- `participant.joined`, `participant.left`, `participant.settled`

### User Events

- `user.registered`, `user.login`, `user.logout`, `user.profile.updated`

### Discovery Events

- `search.performed`, `filter.applied`

### Engagement Events

- `page.viewed`, `button.clicked`, `error.occurred`

## Usage

### Track an Event

```typescript
import { AnalyticsIngestService } from "./realtime-analytics";

await analyticsIngest.trackEvent(
    AnalyticsEventType.SPLIT_CREATED,
    { splitId: "123", totalAmount: 100 },
    { userId: "user-456", source: "api" },
);
```

### Query Metrics

```bash
GET /analytics/metrics?dateFrom=2026-04-21&dateTo=2026-04-28
```

## Environment Variables

```env
# Kafka (optional)
KAFKA_BROKERS=localhost:9092

# ClickHouse (optional)
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DB=analytics

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

## Fallback Behavior

- If Kafka unavailable: Events stored directly in ClickHouse
- If ClickHouse unavailable: Queries return fallback metrics
- If Redis unavailable: Queries hit ClickHouse directly (slower)

## Data Retention

- Raw events: 90 days (ClickHouse TTL)
- Aggregated metrics: 1 year
- Daily aggregates: 3 years

## Tests

- `analytics.test.ts` - Unit tests
- See [docs/REALTIME_ANALYTICS.md](../../../docs/REALTIME_ANALYTICS.md) for testing guide

## Documentation

For comprehensive documentation including:

- Ingestion pipeline details
- Caching strategy
- Query endpoint specifications
- Fallback mechanisms
- Deployment dependencies
- Troubleshooting guide

See [docs/REALTIME_ANALYTICS.md](../../../docs/REALTIME_ANALYTICS.md)
