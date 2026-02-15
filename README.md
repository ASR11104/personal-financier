# Personal Financier

A comprehensive personal finance management application for tracking expenses, incomes, investments, accounts, and financial analytics.

## Overview

Personal Financier is a full-stack web application that helps private sector professionals manage their finances effectively. It provides features for tracking expenses, incomes, investments, loans, and bank accounts, along with powerful analytics to understand spending patterns and financial health.

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **ORM/Migrations**: Knex.js
- **Authentication**: JWT with refresh tokens
- **Validation**: express-validator
- **Logging**: Winston

### Frontend
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **State Management**: TanStack Query (React Query)
- **Charts**: Recharts
- **Date Handling**: date-fns

## Features

### Core Features
- **User Authentication**: JWT-based auth with registration, login, and profile management
- **Account Management**: Track multiple accounts (checking, savings, credit cards, cash, loans)
- **Expense Tracking**: Record and categorize expenses with tags
- **Income Tracking**: Track multiple income sources
- **Investment Portfolio**: Manage investments including SIPs, stocks, mutual funds
- **Categories & Tags**: Customizable categories and tags for transactions
- **Financial Analytics**: Detailed analytics with charts and summaries
- **Loan Tracking**: Track loans with payment schedules and projections

### Pages
- **Dashboard**: Overview of financial health with summary cards and charts
- **Expenses**: List, add, edit, and filter expenses
- **Incomes**: List, add, edit, and filter income sources
- **Investments**: Portfolio management with SIP tracking
- **Accounts**: Manage bank accounts and financial accounts
- **Analytics**: Detailed financial reports and visualizations
- **Categories**: Manage transaction categories
- **Profile**: User profile and settings

## Project Structure

```
personal-financier/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Route controllers
│   │   ├── database/         # Database connection & seeds
│   │   ├── middleware/       # Express middleware (auth, error handling)
│   │   ├── migrations/       # Database migrations
│   │   ├── routes/           # API routes
│   │   ├── utils/           # Utility functions
│   │   ├── constants.ts     # Application constants
│   │   └── index.ts         # Entry point
│   ├── docker-compose.yml   # Docker services
│   ├── knexfile.ts          # Knex configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── Makefile                 # Docker management commands
├── package-lock.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker (for database)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd personal-financier
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure environment**

   For the backend, create a `.env` file in the backend directory:
   ```bash
   cp backend/.env.example backend/.env
   ```

   Update the following variables:
   - `DB_PASSWORD`: Your PostgreSQL password
   - `JWT_SECRET`: A secure random string for JWT signing

### Running the Application

#### Option 1: Using Makefile (Recommended)

```bash
# Start all services
make up

# Stop all services
make down

# View database logs
make logs

# Clean up (stop and remove volumes)
make clean
```

#### Option 2: Manual Start

1. **Start PostgreSQL with Docker**
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   cd backend
   npm run migrate
   ```

3. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

4. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:3000`.

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

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
- `GET /api/accounts/balance` - Get account balances summary

### Expenses
- `GET /api/expenses` - List expenses (with filters)
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense details
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Get expense summary

### Incomes
- `GET /api/incomes` - List incomes (with filters)
- `POST /api/incomes` - Create income
- `GET /api/incomes/:id` - Get income details
- `PUT /api/incomes/:id` - Update income
- `DELETE /api/incomes/:id` - Delete income
- `GET /api/incomes/summary` - Get income summary

### Investments
- `GET /api/investments` - List investments
- `POST /api/investments` - Create investment
- `GET /api/investments/:id` - Get investment details
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment
- `GET /api/investments/summary` - Get investment summary
- `GET /api/investments/types` - List investment types

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/:id` - Get category details
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Analytics
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/expenses` - Expense analytics
- `GET /api/analytics/incomes` - Income analytics
- `GET /api/analytics/investments` - Investment analytics
- `GET /api/analytics/loans` - Loan analytics

## Database Schema

### Core Tables
- **users** - User accounts and preferences
- **accounts** - Bank accounts, cash, credit cards, loans
- **categories** - Transaction categories (income/expense/transfer)
- **sub_categories** - Sub-categories for transactions
- **recurring_expenses** - Templates for recurring expenses
- **expenses** - Individual expense records
- **incomes** - Income records
- **investments** - Investment portfolio
- **investment_types** - Types of investments
- **tags** - Custom tags for transactions
- **ledger_entries** - Account balance tracking

## Development

### Creating Migrations
```bash
cd backend
npm run migrate:make migration_name
```

### Rolling Back Migrations
```bash
cd backend
npm run migrate:rollback
```

### Running Seeds
```bash
cd backend
npm run seed
```

## License

MIT
