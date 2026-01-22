# Recurring Splits Module

A comprehensive module for managing recurring bill splits in StellarSplit. Enables users to create recurring splits (rent, subscriptions, utilities) with automatic generation, reminders, and flexible scheduling.

## Features

✅ **Recurring Split Management**
- Create recurring splits from template splits
- Support for weekly, biweekly, and monthly frequencies
- Optional end dates for time-limited recurring splits
- Pause/resume functionality without losing configuration

✅ **Automatic Split Generation**
- Cron-based scheduler runs every 6 hours
- Automatically generates new splits from templates at specified intervals
- Copies participants and amounts from template splits
- Respects pause/resume state and end dates

✅ **Smart Reminders**
- Configurable reminder notifications (1-30 days before due date)
- Real-time WebSocket notifications via Socket.io
- Twice-daily reminder check (9 AM and 5 PM UTC)
- Toggle reminders on/off per recurring split

✅ **Template Management**
- Edit template split details
- Changes apply to future generated splits only
- Preserve template for consistent split creation

✅ **Statistics & Insights**
- View all recurring splits for a creator
- See upcoming occurrences at a glance
- Track active vs paused splits
- Get summary statistics

## Entity Structure

### RecurringSplit

```typescript
{
  id: UUID                                    // Primary key
  creatorId: string                           // Wallet address of creator
  templateSplitId: UUID                       // Foreign key to Split (template)
  frequency: 'weekly' | 'biweekly' | 'monthly'
  nextOccurrence: Date                        // When next split should be generated
  endDate?: Date                              // Optional end date
  isActive: boolean                           // Pause/resume flag
  autoRemind: boolean                         // Enable/disable reminders
  reminderDaysBefore: number                  // Days before due date (1-30)
  description?: string                        // Custom description
  createdAt: Date                             // Creation timestamp
  updatedAt: Date                             // Last update timestamp
}
```

## API Endpoints

### Create Recurring Split
```http
POST /recurring-splits
Content-Type: application/json

{
  "creatorId": "GXXX...",
  "templateSplitId": "550e8400-e29b-41d4-a716-446655440000",
  "frequency": "monthly",
  "autoRemind": true,
  "reminderDaysBefore": 1,
  "description": "Monthly rent payment"
}
```

### Get All Recurring Splits for Creator
```http
GET /recurring-splits/creator/:creatorId
```

Returns: `RecurringSplit[]`

### Get Statistics
```http
GET /recurring-splits/stats/:creatorId
```

Returns:
```json
{
  "total": 5,
  "active": 3,
  "paused": 2,
  "nextOccurrences": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nextOccurrence": "2026-02-22T00:00:00.000Z"
    }
  ]
}
```

### Get Recurring Split by ID
```http
GET /recurring-splits/:id
```

Returns: `RecurringSplit`

### Update Recurring Split
```http
PATCH /recurring-splits/:id
Content-Type: application/json

{
  "frequency": "weekly",
  "autoRemind": false,
  "reminderDaysBefore": 3,
  "description": "Updated description"
}
```

### Pause Recurring Split
```http
POST /recurring-splits/:id/pause
```

Returns: `RecurringSplit` with `isActive: false`

### Resume Recurring Split
```http
POST /recurring-splits/:id/resume
```

Returns: `RecurringSplit` with `isActive: true` and recalculated `nextOccurrence`

### Delete Recurring Split
```http
DELETE /recurring-splits/:id
```

### Update Template Split
```http
PATCH /recurring-splits/:id/template
Content-Type: application/json

{
  "totalAmount": 1500,
  "description": "Updated rent amount"
}
```

Returns: Updated `Split` entity

### Manual Processing (Admin/Testing)
```http
POST /recurring-splits/:id/process-now
```

Returns:
```json
{
  "message": "Recurring split processed successfully"
}
```

## Cron Scheduler

### Split Generation Job
- **Schedule**: Every 6 hours
- **Action**: Processes all active, due recurring splits
- **Output**: Generates new splits and emits WebSocket notifications
- **Checks**:
  - Recurring split is active
  - Current time >= nextOccurrence
  - End date (if set) has not passed

### Reminder Notification Job
- **Schedule**: Twice daily (9 AM & 5 PM UTC)
- **Action**: Sends reminders for upcoming recurring splits
- **Timeframe**: Within 24 hours of reminder date
- **Conditions**:
  - Recurring split has autoRemind enabled
  - Current time is within reminder window

### Cleanup Job
- **Schedule**: Daily at 2 AM UTC
- **Action**: Deactivates expired recurring splits
- **Conditions**:
  - Recurring split has endDate
  - Current time > endDate

## WebSocket Events

### Split Generated
```javascript
socket.on('split-completion', {
  type: 'split_generated',
  recurringSplitId: 'uuid',
  generatedSplitId: 'uuid',
  totalAmount: 1000,
  description: 'Monthly rent (Jan 22, 2026)',
  timestamp: '2026-01-22T00:00:00.000Z'
})
```

### Reminder Notification
```javascript
socket.on('payment-notification', {
  type: 'recurring_split_reminder',
  recurringSplitId: 'uuid',
  nextOccurrence: '2026-02-22T00:00:00.000Z',
  daysUntilDue: 1,
  amount: 1000,
  description: 'Monthly rent payment',
  timestamp: '2026-01-21T00:00:00.000Z'
})
```

### Recurring Split Expired
```javascript
socket.on('payment-notification', {
  type: 'recurring_split_expired',
  recurringSplitId: 'uuid',
  description: 'Monthly rent payment',
  timestamp: '2026-06-22T00:00:00.000Z'
})
```

## Usage Examples

### Create a Monthly Rent Split
```typescript
await recurringSplitsService.createRecurringSplit({
  creatorId: 'G123456789...',
  templateSplitId: 'split-uuid',
  frequency: 'monthly',
  autoRemind: true,
  reminderDaysBefore: 3,
  description: 'Monthly rent',
});
```

### Pause a Recurring Split
```typescript
await recurringSplitsService.pauseRecurringSplit('recurring-split-uuid');
```

### Resume with Recalculated Next Occurrence
```typescript
await recurringSplitsService.resumeRecurringSplit('recurring-split-uuid');
// nextOccurrence is recalculated from current date
```

### Update Template for Future Splits
```typescript
await recurringSplitsService.updateTemplate('recurring-split-uuid', {
  totalAmount: 1500, // Only affects future splits
});
```

### Get Upcoming Occurrences
```typescript
const stats = await recurringSplitsService.getRecurringSplitStats('creator-wallet');
// stats.nextOccurrences sorted by date
```

## Database Schema

```sql
CREATE TABLE recurring_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id VARCHAR NOT NULL,
  template_split_id UUID NOT NULL REFERENCES splits(id),
  frequency VARCHAR NOT NULL,
  next_occurrence TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_remind BOOLEAN NOT NULL DEFAULT true,
  reminder_days_before INT NOT NULL DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recurring_splits_creator_id ON recurring_splits(creator_id);
CREATE INDEX idx_recurring_splits_template_split_id ON recurring_splits(template_split_id);
CREATE INDEX idx_recurring_splits_is_active ON recurring_splits(is_active);
CREATE INDEX idx_recurring_splits_next_occurrence ON recurring_splits(next_occurrence);
```

## Testing

Comprehensive test coverage is included:

### Run Service Tests
```bash
npm test recurring-splits.service.spec.ts
```

### Run Controller Tests
```bash
npm test recurring-splits.controller.spec.ts
```

### Run All Recurring Splits Tests
```bash
npm test -- --testPathPattern=recurring-splits
```

### Test Coverage
- ✅ Entity creation and validation
- ✅ CRUD operations
- ✅ Pause/resume functionality
- ✅ Template editing
- ✅ Automatic split generation
- ✅ Reminder calculations
- ✅ Statistics generation
- ✅ Error handling
- ✅ API endpoints
- ✅ Cron job execution

## Error Handling

### Common Errors

**BadRequestException**
- Invalid end date (in the past)
- Invalid frequency
- Invalid reminder days (< 1 or > 30)

**NotFoundException**
- Template split not found
- Recurring split not found
- Creator not found

**ConflictException**
- Attempting to pause already paused split
- Attempting to resume already active split
- Duplicate transaction hash

## Performance Considerations

1. **Indexing**: Indexes on `creator_id`, `template_split_id`, `is_active`, and `next_occurrence`
2. **Batch Processing**: Scheduler processes multiple recurring splits in batches
3. **Caching**: Consider caching frequently accessed creator statistics
4. **Query Optimization**: Uses eager loading for related entities

## Future Enhancements

- [ ] Email reminders integration
- [ ] SMS notifications
- [ ] Custom cron expressions
- [ ] Recurring split templates
- [ ] Split history and analytics
- [ ] Automatic payment setup
- [ ] Webhook notifications
- [ ] Export recurring splits as CSV

## Dependencies

- `@nestjs/common` - NestJS framework
- `@nestjs/schedule` - Cron job scheduling
- `typeorm` - ORM
- `socket.io` - Real-time notifications

## Integration Points

- **PaymentGateway**: WebSocket notifications
- **Split Entity**: Template and generated splits
- **Participant Entity**: Participant copying on generation
- **ConfigService**: Configuration management
