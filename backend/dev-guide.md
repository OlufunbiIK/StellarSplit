# StellarSplit Backend Developer Guide

Welcome to the StellarSplit backend 🚀

This guide helps new developers set up and contribute to the NestJS backend service.

---

# Prerequisites

- Node.js v18+ (v20+ recommended)
- npm (comes with Node.js)
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+
- Stellar Testnet account (for blockchain integration)

---

# Project Structure

The backend is a standalone NestJS package (not a monorepo):

```
backend/
├── src/                    # Source code
│   ├── analytics/          # Analytics module
│   ├── auth/               # Authentication module
│   ├── batch/              # Background jobs (Bull)
│   ├── common/             # Shared utilities
│   ├── compliance/         # Compliance features
│   ├── config/             # Configuration
│   ├── database/           # Database configuration
│   ├── email/              # Email service
│   ├── entities/           # Database entities
│   ├── export/             # Export functionality
│   ├── fraud-detection/    # ML fraud detection
│   ├── modules/            # Core modules (splits, items, etc.)
│   ├── ocr/                # OCR receipt processing
│   ├── payments/           # Stellar payments
│   ├── receipts/           # Receipt management
│   ├── realtime-analytics/ # Real-time analytics
│   ├── webhooks/           # Webhook handling
│   ├── app.module.ts       # Root module
│   └── main.ts             # Application entry point
├── test/                   # E2E tests
├── docs/                   # Additional documentation
├── scripts/                # Utility scripts
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
└── jest.config.js          # Jest test config
```

---

# Setup Steps

## 1. Clone Repository

```bash
git clone https://github.com/patrickNwafo/StellarSplit.git
cd StellarSplit/backend
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Setup Environment Variables

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=stellarsplit_dev
DB_SYNCHRONIZE=true
DB_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=change-me

# Stellar
STELLAR_NETWORK=testnet

# Email (optional)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=
MAIL_PASS=

# API Documentation
SWAGGER_PATH=/api/docs
SWAGGER_TITLE=StellarSplit API
SWAGGER_DESCRIPTION=API for StellarSplit - Split bills instantly with crypto
SWAGGER_VERSION=1.0.0
```

---

## 4. Start Infrastructure

Using Docker Compose:

```bash
cd ..
docker-compose up -d postgres redis
```

This starts PostgreSQL and Redis containers.

---

## 5. Run Database Migrations

```bash
cd backend
npm run migration:run
```

---

## 6. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

---

# Available Scripts

| Command                      | Description                              |
| ---------------------------- | ---------------------------------------- |
| `npm run start`              | Start production server                  |
| `npm run start:dev`          | Start development server with hot reload |
| `npm run build`              | Build for production                     |
| `npm run lint`               | Run ESLint                               |
| `npm run dev`                | Run with ts-node (no watch)              |
| `npm run dev:watch`          | Run with nodemon                         |
| `npm run test`               | Run unit tests                           |
| `npm run test:watch`         | Run tests in watch mode                  |
| `npm run test:coverage`      | Run tests with coverage                  |
| `npm run migration:generate` | Generate TypeORM migration               |
| `npm run migration:run`      | Run pending migrations                   |

---

# Coding Standards

- **TypeScript**: Strict mode enabled
- **Module Structure**: Feature-based (each module has controller, service, entities, DTOs)
- **Validation**: All DTOs use `class-validator` decorators
- **Separation of Concerns**: No business logic in controllers
- **Service Layer**: All external calls (Stellar, database, APIs) go through services
- **Error Handling**: Use NestJS built-in exceptions with proper HTTP status codes
- **Logging**: Use NestJS Logger service

---

# Module Structure

Each module follows this pattern:

```
module-name/
├── module-name.module.ts       # Module definition
├── module-name.controller.ts   # HTTP endpoints
├── module-name.service.ts      # Business logic
├── dto/                        # Data transfer objects
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── *.response.dto.ts
├── entities/                   # Database entities (if applicable)
└── *.spec.ts                  # Unit tests
```

---

# How to Add a New Module

1. **Create module directory** in `src/`
2. **Generate module files**:

```bash
nest g module module-name
nest g controller module-name
nest g service module-name
```

3. **Add DTOs** in `dto/` folder with validation decorators
4. **Add entities** (if needed) in `entities/` folder
5. **Register module** in `src/app.module.ts`
6. **Add tests** for controller and service

---

# Git Workflow

- Create feature branch from `main`
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Keep PRs focused on a single feature/fix
- Ensure all tests pass before PR
- Update documentation for any API changes

---

# Testing

## Unit Tests

```bash
npm run test
```

## E2E Tests

```bash
npm run test -- test/
```

## Coverage Report

```bash
npm run test:coverage
```

---

# Stellar Integration Guide

- Use `@stellar/stellar-sdk` for blockchain operations
- Always validate transaction hash before updating database
- Confirm transaction success (not just submission)
- Handle network timeouts gracefully with retries
- Use testnet for development, mainnet for production
- Never store private keys in code - use environment variables

---

# Database Operations

- Use TypeORM for all database operations
- Use transactions for multi-step operations
- Add indexes for frequently queried fields
- Use soft deletes where appropriate
- Always validate input before database operations

---

# API Documentation

API documentation is auto-generated using Swagger:

```bash
npm run start:dev
# Visit http://localhost:3000/api
```

---

# Common Issues

**Port already in use:**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Database connection failed:**

- Check PostgreSQL is running: `docker ps`
- Verify DATABASE_URL in .env
- Check database exists

**Migration failed:**

- Rollback: `npm run migration:revert`
- Check migration file for syntax errors
- Ensure database is up to date

---

# Useful Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Stellar Developer Documentation](https://developers.stellar.org)
- [Stellar SDK](https://github.com/stellar/js-stellar-sdk)
- [Project README](../README.md)

---

# Vision

StellarSplit aims to remove awkward money conversations by making crypto bill splitting instant and seamless using the Stellar blockchain.

---

Welcome to the team 💫
