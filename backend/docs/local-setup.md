# Backend Local Development Setup

This guide provides detailed steps for setting up the StellarSplit backend for local development.

---

## Prerequisites

- **Node.js**: v18+ (v20+ recommended)
    - Download: https://nodejs.org/
    - Verify: `node --version` should show v18 or higher
- **npm**: Comes with Node.js
    - Verify: `npm --version`
- **Docker & Docker Compose**: For running PostgreSQL and Redis
    - Download: https://www.docker.com/products/docker-desktop
    - Verify: `docker --version` and `docker-compose --version`
- **Git**: For version control
    - Verify: `git --version`

---

## Quick Start

For experienced developers, here's the fastest way to get started:

```bash
# Clone and navigate
git clone https://github.com/patrickNwafo/StellarSplit.git
cd StellarSplit/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start infrastructure
cd ..
docker-compose up -d postgres redis
cd backend

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000`

---

## Detailed Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/patrickNwafo/StellarSplit.git
cd StellarSplit/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all dependencies defined in `package.json` including:

- NestJS framework
- TypeORM for database operations
- Stellar SDK for blockchain integration
- Other required packages

### Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration. Required variables:

```env
# Application Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=stellarsplit_dev
DB_SYNCHRONIZE=true
DB_LOGGING=true

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Authentication
JWT_SECRET=change-me-in-production

# Stellar Blockchain Configuration
STELLAR_NETWORK=testnet

# Email Configuration (optional, for notifications)
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

### Step 4: Start Infrastructure Services

The backend requires PostgreSQL and Redis. Use Docker Compose:

```bash
cd ..
docker-compose up -d postgres redis
```

Verify services are running:

```bash
docker ps
```

You should see `postgres` and `redis` containers running.

### Step 5: Initialize Database

Run database migrations:

```bash
cd backend
npm run migration:run
```

This will create all necessary tables and relationships.

### Step 6: Start Development Server

```bash
npm run start:dev
```

The server will start with hot-reload enabled. You should see:

```
[Nest] 12345  - [NestFactory] Starting Nest application...
[InstanceLoader] AppModule dependencies initialized +123ms
[InstanceLoader] AuthModule dependencies initialized +45ms
...
Application is running on: http://localhost:3000
```

### Step 7: Verify Setup

Visit the following URLs to verify:

- **API Root**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health (if available)

---

## Development Workflow

### Running Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Linting

```bash
# Run ESLint
npm run lint

# Auto-fix linting issues
npm run lint -- --fix
```

### Building for Production

```bash
# Build the project
npm run build

# The compiled files will be in the dist/ directory
```

### Database Migrations

```bash
# Generate a new migration
npm run migration:generate -- -d src/database/data-source.ts -- -n MigrationName

# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

---

## Troubleshooting

### Port Already in Use

If you get an error that port 3000 is already in use:

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port by setting PORT in .env
PORT=3001 npm run start:dev
```

### Database Connection Failed

If you can't connect to PostgreSQL:

1. Check Docker containers:

```bash
docker ps
```

2. Check PostgreSQL logs:

```bash
docker logs postgres
```

3. Verify DATABASE_URL in .env matches Docker configuration:

```bash
# Should match docker-compose.yml postgres configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stellarsplit
```

4. Restart PostgreSQL container:

```bash
docker-compose restart postgres
```

### Redis Connection Failed

If Redis connection fails:

1. Check Redis container:

```bash
docker ps
```

2. Check Redis logs:

```bash
docker logs redis
```

3. Test Redis connection:

```bash
docker exec -it redis redis-cli ping
# Should return: PONG
```

### Migration Errors

If migrations fail:

1. Check migration file syntax
2. Ensure database is accessible
3. Try reverting and re-running:

```bash
npm run migration:revert
npm run migration:run
```

### TypeORM Connection Issues

If TypeORM can't connect:

1. Verify DATABASE_URL format:

```
postgresql://username:password@host:port/database
```

2. Check if database exists:

```bash
docker exec -it postgres psql -U postgres -c "\l"
```

3. Create database if needed:

```bash
docker exec -it postgres psql -U postgres -c "CREATE DATABASE stellarsplit;"
```

---

## IDE Setup

### VS Code

Recommended extensions:

- ESLint
- Prettier
- TypeScript
- NestJS Snippets

### VS Code Settings (optional)

Create `.vscode/settings.json`:

```json
{
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Useful Development Commands

| Command                      | Description                      |
| ---------------------------- | -------------------------------- |
| `npm run start:dev`          | Start dev server with hot reload |
| `npm run dev:watch`          | Start with nodemon               |
| `npm run build`              | Build for production             |
| `npm run lint`               | Check code quality               |
| `npm run test`               | Run unit tests                   |
| `npm run test:watch`         | Run tests in watch mode          |
| `npm run test:coverage`      | Generate coverage report         |
| `npm run migration:generate` | Create new migration             |
| `npm run migration:run`      | Apply migrations                 |
| `npm run migration:revert`   | Revert last migration            |

---

## Next Steps

After completing setup:

1. Read the [Developer Guide](../dev-guide.md) for coding standards
2. Review the [Architecture Documentation](./architecture.md)
3. Explore the module structure in `src/`
4. Check out the [API Documentation](http://localhost:3000/api) after starting the server

---

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review the main [README](../../README.md)
3. Check existing [GitHub Issues](https://github.com/patrickNwafo/StellarSplit/issues)
4. Ask in the project discussions

---

Happy coding! 🚀
