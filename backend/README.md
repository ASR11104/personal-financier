# Personal Financier Backend

A Node.js/Express backend for personal finance management with PostgreSQL database.

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **ORM/Migrations**: Knex.js
- **Authentication**: JWT with refresh tokens
- **Validation**: express-validator
- **Logging**: Winston

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Update the following in `.env`:
- `DB_PASSWORD`: Your PostgreSQL password
- `JWT_SECRET`: A secure random string for JWT signing

### 3. Start Database (Docker)

```bash
docker-compose up -d
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Accounts
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/:id` - Get account details
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/balance` - Get account balances

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense details
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Get expense summary

### Health
- `GET /api/health` - Health check

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── database/         # Database connection
│   ├── middleware/       # Express middleware
│   ├── migrations/       # Database migrations
│   ├── routes/           # API routes
│   └── index.ts          # Entry point
├── .env.example          # Environment template
├── knexfile.ts           # Knex configuration
├── package.json
└── tsconfig.json
```

## Database Schema

Based on the tables defined in TABLES.md:

1. **users** - User accounts and preferences
2. **accounts** - Bank accounts, cash, digital wallets
3. **categories** - Transaction categories
4. **sub_categories** - Sub-categories
5. **recurring_expenses** - Recurring expense templates
6. **expenses** - Individual expense records
7. **ledger_entries** - Account ledger entries

## Development

### Running Tests

```bash
npm test
```

### Creating Migrations

```bash
npm run migrate:make migration_name
```

### Rolling Back Migrations

```bash
npm run migrate:rollback
```

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Run migrations:
   ```bash
   npm run migrate --env=production
   ```

4. Start the server:
   ```bash
   npm start
   ```

## License

MIT
