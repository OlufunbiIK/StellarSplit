# Recurring Splits Module - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- NestJS backend running on port 3000
- PostgreSQL database
- npm/pnpm package manager

### Installation Steps

#### 1. Install @nestjs/schedule (if not already installed)
```bash
npm install @nestjs/schedule
```

#### 2. Run Database Migration
```bash
npm run typeorm migration:run
```

This creates the `recurring_splits` table with all necessary columns and indexes.

#### 3. Verify Module is Loaded
Check that `RecurringSplitsModule` is imported in `app.module.ts`:

```typescript
import { RecurringSplitsModule } from './recurring-splits/recurring-splits.module';

@Module({
  imports: [
    // ... other modules
    RecurringSplitsModule,
  ],
})
```

#### 4. Start the Backend
```bash
npm run dev:watch
```

#### 5. Access Swagger Documentation
Navigate to: `http://localhost:3000/api/docs`

You should see "Recurring Splits" tag with all 12 endpoints.

---

## 📌 Common Use Cases

### Use Case 1: Create Monthly Rent Recurring Split

First, create a template split (via existing splits API):
```bash
# 1. Create a template split
POST /splits
{
  "totalAmount": 1500,
  "description": "Monthly Rent",
  "participants": [
    { "walletAddress": "GUSER1...", "amountOwed": 750 },
    { "walletAddress": "GUSER2...", "amountOwed": 750 }
  ]
}
# Note the split ID returned
```

Then create the recurring split:
```bash
POST /recurring-splits
{
  "creatorId": "GCREATOR...",
  "templateSplitId": "550e8400-e29b-41d4-a716-446655440000",
  "frequency": "monthly",
  "autoRemind": true,
  "reminderDaysBefore": 3,
  "description": "Monthly Rent - Apartment"
}
```

**Result**: A new split will be generated automatically every month on the 22nd (from nextOccurrence date).

---

### Use Case 2: Pause During Vacation

```bash
POST /recurring-splits/{id}/pause
```

**Result**: No new splits will be generated until resumed.

Resume when back:
```bash
POST /recurring-splits/{id}/resume
```

**Result**: nextOccurrence is recalculated from current date, generation resumes.

---

### Use Case 3: Update Rent Amount

The rent increased by $200, update it for future months:

```bash
PATCH /recurring-splits/{id}/template
{
  "totalAmount": 1700,
  "description": "Monthly Rent - Increased"
}
```

**Result**: 
- Next generated split will have $1700 total
- Previous splits remain unchanged
- Participants will need adjustment (create new recurring split or update template split directly)

---

### Use Case 4: Check Upcoming Splits

```bash
GET /recurring-splits/stats/{creatorId}
```

**Response**:
```json
{
  "total": 5,
  "active": 4,
  "paused": 1,
  "nextOccurrences": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nextOccurrence": "2026-02-22T00:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "nextOccurrence": "2026-02-25T00:00:00.000Z"
    }
  ]
}
```

---

### Use Case 5: Weekly Team Lunch Split

```bash
POST /recurring-splits
{
  "creatorId": "GTEAM_LEAD...",
  "templateSplitId": "lunch-split-id",
  "frequency": "weekly",
  "autoRemind": true,
  "reminderDaysBefore": 1,
  "description": "Friday Team Lunch"
}
```

**Result**: A new split every Friday at the same time.

---

## 🔄 Scheduler Jobs

The module includes 3 automatic cron jobs:

### Job 1: Split Generation (Every 6 hours)
```
Runs at: 00:00, 06:00, 12:00, 18:00 UTC
Action:  Generate new splits from templates that are due
```

You can manually trigger for testing:
```bash
POST /recurring-splits/{id}/process-now
```

### Job 2: Reminders (Twice daily)
```
Runs at: 09:00 and 17:00 UTC
Action:  Send WebSocket notifications for upcoming splits
```

Users receive real-time notifications via Socket.io when reminders are due.

### Job 3: Cleanup (Daily)
```
Runs at: 02:00 UTC
Action:  Deactivate recurring splits that have reached their end date
```

---

## 📊 Real-Time Notifications (WebSocket)

### Listen for Split Generated
```javascript
socket.on('split-completion', (data) => {
  console.log('New split generated:', {
    generatedSplitId: data.generatedSplitId,
    totalAmount: data.totalAmount,
    description: data.description,
  });
});
```

### Listen for Reminders
```javascript
socket.on('payment-notification', (data) => {
  if (data.type === 'recurring_split_reminder') {
    console.log('Reminder:', {
      amount: data.amount,
      daysUntilDue: data.daysUntilDue,
      description: data.description,
    });
  }
});
```

### Listen for Expiry
```javascript
socket.on('payment-notification', (data) => {
  if (data.type === 'recurring_split_expired') {
    console.log('Recurring split has ended:', data.description);
  }
});
```

---

## 🧪 Testing

### Run All Tests
```bash
npm test -- --testPathPattern=recurring-splits
```

### Run Only Service Tests
```bash
npm test recurring-splits.service.spec.ts
```

### Run Only Controller Tests
```bash
npm test recurring-splits.controller.spec.ts
```

### Test with Coverage
```bash
npm test -- --testPathPattern=recurring-splits --coverage
```

---

## 🐛 Troubleshooting

### Issue: Recurring splits not being generated
**Check**:
1. Scheduler is running (`RecurringSplitsScheduler` should be logged on startup)
2. `@nestjs/schedule` package is installed
3. Check logs for any errors
4. Try manual trigger: `POST /recurring-splits/{id}/process-now`

### Issue: Reminders not being received
**Check**:
1. WebSocket connection is established
2. `autoRemind` is true on the recurring split
3. Current time is within 24 hours of reminder date
4. User is connected to the correct Socket.io room

### Issue: Template updates not affecting future splits
**Note**: Template updates are *additive*, they don't retroactively change participant amounts. 
- Use `PATCH /recurring-splits/{id}/template` to update `totalAmount` and `description`
- For participant changes, create a new recurring split with updated template

### Issue: End date not being respected
**Check**:
1. End date is set to a future date
2. Cleanup job runs at 2 AM UTC daily
3. Check that recurring split isn't set to "paused" status

---

## 📚 Complete API Reference

### Create Recurring Split
```
POST /recurring-splits
Body: CreateRecurringSplitDto
Response: RecurringSplit
```

### Get Creator's Splits
```
GET /recurring-splits/creator/:creatorId
Response: RecurringSplit[]
```

### Get Statistics
```
GET /recurring-splits/stats/:creatorId
Response: { total, active, paused, nextOccurrences }
```

### Get Single Split
```
GET /recurring-splits/:id
Response: RecurringSplit
```

### Update Settings
```
PATCH /recurring-splits/:id
Body: UpdateRecurringSplitDto
Response: RecurringSplit
```

### Pause Split
```
POST /recurring-splits/:id/pause
Response: RecurringSplit
```

### Resume Split
```
POST /recurring-splits/:id/resume
Response: RecurringSplit
```

### Delete Split
```
DELETE /recurring-splits/:id
Response: 204 No Content
```

### Update Template
```
PATCH /recurring-splits/:id/template
Body: { totalAmount?, description? }
Response: Split
```

### Manual Process
```
POST /recurring-splits/:id/process-now
Response: { message: "..." }
```

---

## 🎯 Best Practices

1. **Always create a template split first** before creating a recurring split
2. **Set reminders 1-3 days before** for bill payments
3. **Use monthly frequency** for rent, utilities, subscriptions
4. **Use weekly frequency** for shared meals, carpool costs
5. **Set an end date** for time-limited recurring costs (e.g., lease ending)
6. **Pause instead of delete** if you might resume later
7. **Monitor statistics** to see upcoming occurrences
8. **Test with process-now** before relying on scheduler

---

## 📖 Further Reading

- [README.md](./README.md) - Full feature documentation
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Implementation details
- [Service Code](./recurring-splits.service.ts) - Implementation details
- [Controller Code](./recurring-splits.controller.ts) - All endpoint definitions

---

## 💡 Tips & Tricks

### Track Multiple Bills
Create separate recurring splits for each expense:
- Rent (monthly)
- Utilities (monthly)
- Groceries (weekly)
- Coffee club (biweekly)

### Adjust for Inflation
Update the template amount annually without creating a new recurring split.

### Dry Run a Recurring Split
1. Create with `endDate` one month in future
2. Monitor the generated splits
3. If satisfied, delete and recreate without end date

### Pause All Splits for Creator
Call pause endpoint for each recurring split (future: batch operation)

### Export Schedule
Use `/recurring-splits/stats/:creatorId` to get all upcoming dates.

---

## 📞 Support

For issues or questions:
1. Check logs: `npm run dev:watch`
2. Test endpoint: `POST /recurring-splits/:id/process-now`
3. Review test files for expected behavior
4. Check Swagger docs: `http://localhost:3000/api/docs`

---

**Happy splitting! 💰**
