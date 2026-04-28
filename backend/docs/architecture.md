# StellarSplit Architecture

## Overview

StellarSplit is a mobile-friendly crypto bill-splitting application powered by the Stellar network.

It allows users to:

- Scan receipts
- Automatically split bills
- Create participant balances
- Settle payments instantly using XLM or USDC
- Optionally use Soroban escrow contracts for trustless settlement

This document explains how all major components fit together so new contributors can quickly understand the system.

---

# 1. High-Level System Architecture

                        ┌─────────────────────┐
                        │     Frontend        │
                        │  (React + Vite)     │
                        └──────────┬──────────┘
                                   │ HTTPS / WebSocket
                                   ▼
                        ┌─────────────────────┐
                        │      Backend        │
                        │      (NestJS)       │
                        └──────────┬──────────┘
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
        PostgreSQL DB        Redis Cache        Background Workers
              │                                       │
              ▼                                       ▼
        ┌──────────────────────────────────────────────────┐
        │                Stellar Network                   │
        │                                                  │
        │  ┌──────────────┐         ┌──────────────────┐  │
        │  │ Horizon API  │ <----->  │  Soroban Smart  │  │
        │  │ (REST RPC)   │         │   Contract       │  │
        │  └──────────────┘         └──────────────────┘  │
        └──────────────────────────────────────────────────┘

---

# 2. Core Components

## Frontend (React + Vite)

Responsibilities:

- Receipt upload
- Split configuration UI
- Wallet connection
- Transaction signing
- Real-time payment status
- User dashboard

Mobile-first design using:

- React 18+
- TypeScript
- Vite (build tool)
- TailwindCSS
- React Router

---

## Backend (NestJS)

Responsibilities:

- Authentication (JWT)
- Receipt processing
- Split logic
- Participant balance tracking
- Payment orchestration
- Horizon communication
- Soroban invocation
- Webhook verification

Backend is stateless and horizontally scalable.

---

## Database (PostgreSQL)

Stores:

- Users
- Receipts
- Splits
- Participants
- Payments
- Transaction metadata

JSONB fields are used for parsed receipt storage.

---

## Redis

Used for:

- Rate limiting
- WebSocket pub/sub
- Temporary payment state
- Idempotency keys

---

## Stellar Network

Used for:

- Native XLM payments
- USDC payments
- Memo tagging
- On-chain transaction confirmation

---

## Soroban Smart Contract (Optional Escrow Layer)

Used when:

- A split requires escrow-based trust
- Payment is locked until all participants fund
- Funds must be distributed automatically

The contract:

- Accepts deposits
- Tracks participant balances
- Releases funds when conditions are met
- Can refund if deadline expires

---

# 3. Folder Structure

## Project Structure

```
StellarSplit/
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── features/     # Feature-based modules
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities
│   │   └── App.tsx       # Root component
│   ├── vite.config.ts    # Vite configuration
│   └── package.json
└── backend/              # NestJS backend
    ├── src/
    │   ├── analytics/    # Analytics module
    │   ├── auth/         # Authentication module
    │   ├── batch/        # Background jobs (Bull)
    │   ├── common/       # Shared utilities
    │   ├── config/       # Configuration
    │   ├── database/     # Database configuration
    │   ├── email/        # Email service
    │   ├── entities/     # Database entities
    │   ├── modules/      # Core modules (splits, items, etc.)
    │   ├── ocr/          # OCR receipt processing
    │   ├── payments/     # Stellar payments
    │   ├── receipts/     # Receipt management
    │   ├── realtime-analytics/ # Real-time analytics
    │   ├── webhooks/     # Webhook handling
    │   ├── app.module.ts # Root module
    │   └── main.ts       # Application entry point
    ├── package.json
    └── tsconfig.json
```

---

## Frontend Structure

```
frontend/src/
 ├── components/           # Reusable UI components
 ├── features/            # Feature-based modules
 │    ├── auth/
 │    ├── receipts/
 │    ├── splits/
 │    ├── payments/
 ├── hooks/               # Custom React hooks
 ├── lib/                 # Utilities and SDK wrappers
 │    ├── api-client.ts
 │    ├── wallet.ts
 │    └── stellar.ts
 ├── types/               # TypeScript definitions
 └── App.tsx              # Root component
```

Explanation:

- `features/` = domain-based structure
- `lib/` = utilities and SDK wrappers
- `types/` = shared TypeScript definitions
- `hooks/` = custom React hooks for state/logic

---

## Backend Structure

```
backend/src/
 ├── analytics/           # Analytics module
 ├── auth/                # Authentication module
 ├── batch/               # Background jobs (Bull)
 ├── common/              # Shared infrastructure
 │    ├── guards/
 │    ├── interceptors/
 │    └── filters/
 ├── config/              # Configuration
 ├── database/            # Database configuration
 ├── entities/            # Database entities
 ├── modules/             # Core modules
 │    ├── splits/
 │    ├── items/
 │    └── participants/
 ├── ocr/                 # OCR processing
 ├── payments/            # Stellar payments
 ├── receipts/            # Receipt management
 ├── stellar/             # Stellar integration
 ├── webhooks/            # Webhook handling
 ├── app.module.ts        # Root module
 └── main.ts              # Application entry point
```

Explanation:

- Each domain is modular with its own controller, service, DTOs
- `stellar/` handles Horizon interaction
- `common/` contains shared infrastructure
- `modules/` contains core business logic modules

---

# 4. Data Flow: Receipt → Payment Settlement

Step 1 — Upload Receipt
Frontend sends receipt image → Backend stores in S3.

Step 2 — AI Processing
Backend runs OCR + LLM parsing → Extract items + totals → Save JSON to DB.

Step 3 — Create Split
User selects participants → Backend calculates amounts owed → Stores Split + Participants.

Step 4 — Initiate Payment
User clicks "Settle" → Backend prepares Stellar transaction payload.

Step 5 — Wallet Signing
Frontend signs transaction using wallet.

Step 6 — Submit to Stellar
Signed transaction sent to Horizon API.

Step 7 — Confirmation
Backend verifies transaction hash via Horizon.
Split marked as completed.

If Escrow Mode:
Funds go to Soroban contract first.
Contract distributes when fully funded.

---

# 5. Backend → Horizon Communication

Backend uses Stellar SDK to:

- Build transactions
- Fetch account sequence numbers
- Submit signed XDR
- Verify transaction status

Example flow:

1. GET account details from Horizon
2. Build transaction
3. Sign (if backend custodial)
4. Submit via POST /transactions
5. Poll or stream confirmation
6. Update DB

Horizon is REST-based and stateless.

---

# 6. Soroban Contract Flow

When escrow is enabled:

1. Backend builds Soroban invocation
2. Frontend signs transaction
3. Contract stores funds
4. Participants deposit
5. Contract releases funds to split owner
6. Backend records completion

Contract stores:

- Split ID
- Participants
- Deposit status
- Deadline

---

# 7. Key Technologies & Why

React + Vite

- Fast development with hot module replacement
- Modern build tooling
- Great developer experience
- Optimized production builds

NestJS

- Modular architecture
- Strong typing with TypeScript
- Enterprise scalability
- Dependency injection

PostgreSQL

- Reliable relational integrity
- JSONB for receipt storage
- ACID compliance

Redis

- High-performance caching
- Real-time events
- Pub/Sub for WebSockets

Stellar

- Low fees
- Fast settlement (~5 seconds)
- Native asset support

Soroban

- Smart contract escrow logic
- Trust-minimized settlement
- On-chain enforcement

Docker

- Environment consistency
- Easy deployment

---

# 8. Security Model

- JWT authentication with refresh tokens
- Role-based guards
- Input validation with class-validator
- Rate limiting
- Idempotent payment handling
- Horizon verification before marking success
- Contract state verification
- CORS configuration
- Helmet for security headers

---

# 9. Glossary

Split
A bill divided among participants.

Participant
A user assigned a portion of the bill.

Escrow
Temporary smart contract custody of funds before release.

Memo
Optional text field attached to Stellar transactions.

Horizon
Stellar's REST API server for interacting with the network.

Soroban
Stellar's smart contract platform.

Settlement
Final on-chain confirmation of payment.

XDR
Encoded Stellar transaction format.

Trustline
A user's approval to hold a specific asset (e.g., USDC).

---

# 10. Scalability Considerations

- Stateless backend
- Horizontal scaling
- Redis caching
- Background job workers (Bull)
- Event-driven payment confirmations
- Database connection pooling
- CDN for static assets

---

# Conclusion

StellarSplit combines:

- Modern web architecture (React + Vite)
- Modular backend design (NestJS)
- Fast blockchain settlement (Stellar)
- Optional smart contract escrow (Soroban)

This architecture ensures:

- Scalability
- Security
- Transparency
- Developer friendliness

---

End of Architecture Document
