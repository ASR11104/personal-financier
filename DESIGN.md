# Personal Financier - Design Document

## Overview
A personal finance manager for private sector professionals to manage finances, expenses, budget, goals, loans, and income.

---

## 1. System Architecture

### Tech Stack Recommendation
- **Frontend**: React + TypeScript + Tailwind CSS (or Vue.js)
- **Backend**: Node.js + Express (or Python/FastAPI)
- **Database**: PostgreSQL (primary) + Redis (caching)
- **Authentication**: JWT-based auth with refresh tokens
- **API Style**: RESTful APIs
- **Deployment**: Docker + Docker Compose

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web App   │  │  Mobile App │  │  PWA        │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
┌──────────────────────────┼──────────────────────────┐
│                   API Gateway                        │
│         (Rate limiting, Auth, Load balancing)        │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────┐
│                   Application Layer                  │
│  ┌─────────────────────────────────────────────┐    │
│  │              REST API Server                │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │    │
│  │  │ Controllers │ Services │ Middleware │    │    │
│  │  └─────────┘ └─────────┘ └─────────┘      │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────┐
│                   Data Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  PostgreSQL │  │    Redis    │  │ File Storage│  │
│  │  (Primary)  │  │  (Cache)    │  │ (S3/Local)  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

#### Income Table
```sql
CREATE TABLE incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    source VARCHAR(100) NOT NULL,
    description TEXT,
    income_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(20), -- monthly, weekly, yearly
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Expenses Table
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    merchant VARCHAR(100),
    description TEXT,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50),
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(20),
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Categories Table
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system categories
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- income, expense, savings, investment
    icon VARCHAR(50),
    color VARCHAR(7),
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Budgets Table
```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    amount DECIMAL(12, 2) NOT NULL,
    period VARCHAR(20) NOT NULL, -- monthly, weekly, yearly
    start_date DATE NOT NULL,
    end_date DATE,
    alert_threshold INTEGER DEFAULT 80, -- percentage
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Savings Goals Table
```sql
CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0,
    target_date DATE,
    category VARCHAR(100),
    priority INTEGER DEFAULT 1,
    is_achieved BOOLEAN DEFAULT false,
    achieved_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Loans Table
```sql
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- personal, home, car, education, credit_card
    principal_amount DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    term_months INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_payment DECIMAL(12, 2) NOT NULL,
    total_paid DECIMAL(12, 2) DEFAULT 0,
    remaining_balance DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, paid_off, defaulted
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Loan Payments Table
```sql
CREATE TABLE loan_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(12, 2) NOT NULL,
    principal_amount DECIMAL(12, 2),
    interest_amount DECIMAL(12, 2),
    remaining_balance DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Investments Table
```sql
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- stocks, bonds, mutual_funds, crypto, fixed_deposit
    current_value DECIMAL(12, 2) NOT NULL,
    invested_amount DECIMAL(12, 2) NOT NULL,
    purchase_date DATE,
    last_updated DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Accounts Table (Bank Accounts, Cash, Digital Wallets)
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- checking, savings, credit_card, cash, investment, loan
    current_balance DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    institution_name VARCHAR(100),
    account_number_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    last_synced TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Transactions Table (All transactions across accounts)
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- income, expense, transfer, investment
    category_id UUID REFERENCES categories(id),
    description TEXT,
    merchant VARCHAR(100),
    transaction_date TIMESTAMP NOT NULL,
    is_pending BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. API Design

### Authentication
```
POST   /api/auth/register           - Register new user
POST   /api/auth/login              - Login
POST   /api/auth/logout             - Logout
POST   /api/auth/refresh            - Refresh token
POST   /api/auth/forgot-password    - Request password reset
PUT    /api/auth/reset-password     - Reset password
GET    /api/auth/me                 - Get current user
PUT    /api/auth/profile            - Update profile
```

### Income Management
```
GET    /api/incomes                 - List incomes (with filters)
POST   /api/incomes                 - Create income
GET    /api/incomes/:id             - Get income details
PUT    /api/incomes/:id             - Update income
DELETE /api/incomes/:id             - Delete income
GET    /api/incomes/summary         - Income summary
```

### Expense Management
```
GET    /api/expenses                - List expenses (with filters)
POST   /api/expenses                - Create expense
GET    /api/expenses/:id            - Get expense details
PUT    /api/expenses/:id            - Update expense
DELETE /api/expenses/:id            - Delete expense
GET    /api/expenses/summary        - Expense summary
GET    /api/expenses/analytics      - Expense analytics
```

### Budget Management
```
GET    /api/budgets                 - List budgets
POST   /api/budgets                 - Create budget
GET    /api/budgets/:id             - Get budget details
PUT    /api/budgets/:id             - Update budget
DELETE /api/budgets/:id             - Delete budget
GET    /api/budgets/:id/progress    - Get budget progress
```

### Savings Goals
```
GET    /api/goals                   - List savings goals
POST   /api/goals                   - Create goal
GET    /api/goals/:id               - Get goal details
PUT    /api/goals/:id               - Update goal
DELETE /api/goals/:id               - Delete goal
POST   /api/goals/:id/contribute    - Add contribution
```

### Loans
```
GET    /api/loans                   - List loans
POST   /api/loans                   - Create loan
GET    /api/loans/:id               - Get loan details
PUT    /api/loans/:id               - Update loan
DELETE /api/loans/:id               - Delete loan
GET    /api/loans/:id/schedule      - Get amortization schedule
POST   /api/loans/:id/payment       - Record payment
```

### Investments
```
GET    /api/investments             - List investments
POST   /api/investments             - Create investment
GET    /api/investments/:id         - Get investment details
PUT    /api/investments/:id         - Update investment
DELETE /api/investments/:id         - Delete investment
GET    /api/investments/summary     - Investment summary
```

### Accounts
```
GET    /api/accounts                - List accounts
POST   /api/accounts                - Create account
GET    /api/accounts/:id            - Get account details
PUT    /api/accounts/:id            - Update account
DELETE /api/accounts/:id            - Delete account
POST   /api/accounts/:id/sync       - Sync account
```

### Categories
```
GET    /api/categories              - List categories
POST   /api/categories              - Create category
GET    /api/categories/:id          - Get category details
PUT    /api/categories/:id          - Update category
DELETE /api/categories/:id          - Delete category
```

### Dashboard/Analytics
```
GET    /api/dashboard/summary       - Dashboard summary
GET    /api/dashboard/net-worth     - Net worth calculation
GET    /api/dashboard/cash-flow     - Cash flow analysis
GET    /api/reports                 - Generate reports
GET    /api/reports/export          - Export data
```

### Request/Response Examples

**Create Expense Request**
```json
{
  "amount": 50.00,
  "category_id": "uuid-here",
  "merchant": "Coffee Shop",
  "description": "Morning coffee",
  "expense_date": "2026-01-28",
  "payment_method": "credit_card",
  "is_recurring": false
}
```

**Create Budget Request**
```json
{
  "category_id": "uuid-here",
  "amount": 500.00,
  "period": "monthly",
  "start_date": "2026-01-01",
  "alert_threshold": 80
}
```

**Dashboard Summary Response**
```json
{
  "total_balance": 15000.00,
  "monthly_income": 5000.00,
  "monthly_expenses": 2500.00,
  "savings_rate": 50.00,
  "budget_status": {
    "overall": "on_track",
    "categories": [...]
  },
  "recent_transactions": [...],
  "upcoming_bills": [...]
}
```

---

## 4. UI/UX Design

### App Structure

#### Dashboard (Home)
- **Summary Cards**: Total balance, monthly income, monthly expenses, savings rate
- **Quick Actions**: Add expense, add income, view budget, transfer
- **Recent Transactions**: List of latest transactions
- **Budget Progress**: Visual progress bars for budget categories
- **Upcoming Bills**: Reminders for recurring payments
- **Charts**: Income vs expenses chart, expense breakdown pie chart

#### Income Section
- Income list with filters (date range, category, source)
- Add/edit income form
- Income summary with charts (monthly trends, category breakdown)
- Recurring income management

#### Expenses Section
- Expense list with filters (date range, category, merchant)
- Add/edit expense form with receipt upload
- Expense analytics (trends, top categories, merchant breakdown)
- Expense categories management

#### Budget Section
- Budget overview with progress indicators
- Create/edit budget form
- Budget vs actual comparison
- Alerts and notifications for over-budget categories
- Budget history

#### Savings Goals Section
- Goals list with progress visualization
- Create/edit goal form
- Contribution tracking
- Goal completion celebrations
- Goal recommendations

#### Loans Section
- Loan overview dashboard
- Create/edit loan form
- Amortization schedule view
- Payment tracking
- Loan comparison tools
- Payoff calculator

#### Investments Section
- Investment portfolio overview
- Add/edit investment form
- Performance tracking
- Investment type breakdown
- Return on investment calculations

#### Accounts Section
- Account list with balances
- Account details view
- Transaction history per account
- Account connection/sync
- Balance history charts

#### Reports Section
- Custom report builder
- Pre-built reports (monthly, quarterly, yearly)
- Export options (PDF, CSV, Excel)
- Data visualization
- Comparison reports

#### Settings
- Profile management
- Currency and timezone settings
- Notification preferences
- Data backup and export
- Security settings (2FA, password change)
- Linked accounts management

### UI Components Library
- **Buttons**: Primary, secondary, danger, icon buttons
- **Forms**: Input fields, select, date picker, file upload
- **Cards**: Summary cards, transaction cards, goal cards
- **Charts**: Line charts, bar charts, pie charts, area charts
- **Tables**: Transaction tables, reports tables
- **Modals**: Confirmation modals, form modals
- **Navigation**: Sidebar, tabs, breadcrumbs
- **Notifications**: Toast messages, alerts, badges

### Design Principles
1. **Mobile-First**: Responsive design for all screen sizes
2. **Clean & Minimal**: Simple, uncluttered interface
3. **Intuitive Navigation**: Easy to find features
4. **Visual Feedback**: Clear indicators for actions and states
5. **Data Visualization**: Charts and graphs for financial insights
6. **Accessibility**: WCAG 2.1 compliant
7. **Dark Mode**: Support for light and dark themes

---

## 5. Features Breakdown

### Core Features
1. **Transaction Management**
   - Add income and expenses
   - Categorize transactions
   - Attach receipts
   - Search and filter transactions
   - Transaction history

2. **Budget Management**
   - Create budgets by category
   - Set budget periods (weekly, monthly, yearly)
   - Track spending against budget
   - Receive alerts when approaching limits
   - Budget adjustment recommendations

3. **Savings Goals**
   - Set savings targets
   - Track progress with visual indicators
   - Set target dates
   - Automatic contributions tracking
   - Goal achievement notifications

4. **Loan Tracking**
   - Track multiple loans
   - Record payments
   - View amortization schedules
   - Calculate payoffs
   - Interest comparison

5. **Investment Tracking**
   - Track investment portfolio
   - Record purchases and sales
   - Calculate returns
   - Diversification analysis
   - Performance over time

### Advanced Features
1. **Financial Insights**
   - Spending patterns analysis
   - Income trends
   - Net worth calculation
   - Cash flow analysis
   - Recommendations based on data

2. **Recurring Transactions**
   - Set up recurring income
   - Set up recurring expenses
   - Automatic transaction generation
   - Frequency management

3. **Multi-Account Management**
   - Track multiple bank accounts
   - Credit card tracking
   - Cash accounts
   - Investment accounts
   - Consolidated view

4. **Reports & Export**
   - Generate financial reports
   - Export data to CSV/PDF/Excel
   - Custom date ranges
   - Scheduled report generation

### Security Features
1. **Authentication**
   - Secure login with password
   - JWT tokens with refresh
   - Password hashing (bcrypt)
   - Session management

2. **Data Protection**
   - Encrypted sensitive data
   - Secure database connections
   - HTTPS only
   - Regular backups

3. **Privacy**
   - No data sharing with third parties
   - User data ownership
   - Data deletion option

---

## 6. Implementation Phases

### Phase 1: MVP (Minimum Viable Product)
- User authentication
- Basic income/expense tracking
- Simple budget management
- Dashboard with basic charts
- Category management

### Phase 2: Enhanced Features
- Savings  
- Loan tracking
- Investment tracking
- Multi-account support
- Advanced analytics

### Phase 3: Advanced Features
- Recurring transactions
- Automated imports (bank CSV)
- AI-powered insights
- Collaborative features (family budgeting)
- Mobile app

### Phase 4: Future Enhancements
- Bank API integration
- Bill reminders and payments
- Tax preparation tools
- Financial advisor integration
- Multi-language support

---

## 7. Project Structure

```
personal-financier/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── config/
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── styles/
│   ├── tests/
│   └── package.json
├── docs/
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## 8. API Endpoints Summary

| Resource | Methods | Description |
|----------|---------|-------------|
| /auth | POST, GET | Authentication endpoints |
| /incomes | CRUD | Income management |
| /expenses | CRUD | Expense management |
| /budgets | CRUD | Budget management |
| /goals | CRUD | Savings goals |
| /loans | CRUD | Loan management |
| /investments | CRUD | Investment tracking |
| /accounts | CRUD | Account management |
| /categories | CRUD | Category management |
| /dashboard | GET | Dashboard data |
| /reports | GET, POST | Reports generation |

---

## 9. Database Indexes

```sql
CREATE INDEX idx_incomes_user_date ON incomes(user_id, income_date);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_budgets_user ON budgets(user_id);
CREATE INDEX idx_goals_user ON savings_goals(user_id);
CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_accounts_user ON accounts(user_id);
```

---

## 10. Future Considerations

1. **Scalability**: Use caching (Redis), load balancing, database sharding
2. **Performance**: Optimize queries, use pagination, lazy loading
3. **Monitoring**: Logging, error tracking, performance monitoring
4. **Testing**: Unit tests, integration tests, E2E tests
5. **CI/CD**: Automated testing, deployment pipelines
6. **Documentation**: API docs (Swagger), user guides
7. **Accessibility**: Regular audits, user testing

---

## 11. Finance Tracking System

This section explains how the finance tracking works in detail, including the workflow, calculations, and data flow.

### 11.1 Transaction Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Transaction Lifecycle                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Create  │────▶│  Validate    │────▶│  Categorize  │────▶│  Save to    │
│ Transaction│    │  & Sanitize  │     │  & Tag       │     │  Database   │
└──────────┘     └──────────────┘     └──────────────┘     └─────────────┘
                                                                │
                                                                ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Update   │◀────│  Calculate   │◀────│  Update      │◀────│  Trigger    │
│  Dashboard│    │  Balances    │     │  Budgets     │     │  Analytics  │
└──────────┘     └──────────────┘     └──────────────┘     └─────────────┘
```

#### Transaction Creation Process
1. **Input Validation**: Validate amount (positive for income, negative for expense), date, category
2. **Category Assignment**: Auto-assign category based on merchant or manual selection
3. **Account Linking**: Link transaction to specific account (bank account, credit card, cash)
4. **Receipt Attachment**: Optional receipt image/PDF upload
5. **Recurring Check**: Mark as recurring if it's a regular transaction

### 11.2 Balance Calculation

#### Account Balance Formula
```
Current Balance = Previous Balance + Total Income - Total Expenses
```

#### Balance Calculation Process
1. **Initial Balance**: Set starting balance when account is created
2. **Transaction Aggregation**: Sum all transactions for the account
3. **Pending Transactions**: Exclude pending transactions from available balance
4. **Real-time Updates**: Recalculate on every transaction add/update/delete

#### Net Worth Calculation
```
Net Worth = (Sum of All Asset Accounts) - (Sum of All Liability Accounts)
```

**Asset Accounts**: Checking, Savings, Investment, Cash
**Liability Accounts**: Credit Cards, Loans

### 11.3 Budget Tracking Mechanism

#### Budget Monitoring Flow
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│ Transaction │────▶│ Category     │────▶│ Budget Utilization  │
│ Created     │     │ Match        │     │ Calculation         │
└─────────────┘     └──────────────┘     └─────────────────────┘
                                                │
                                                ▼
                                      ┌─────────────────────┐
                                      │ Compare with Limit  │
                                      └─────────────────────┘
                                                │
                         ┌──────────────────────┼──────────────────────┐
                         ▼                      ▼                      ▼
               ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
               │ < Alert         │    │ On Track        │    │ Over Budget     │
               │ Threshold       │    │ (50-90%)        │    │ (>100%)         │
               └─────────────────┘    └─────────────────┘    └─────────────────┘
                         │                      │                      │
                         ▼                      ▼                      ▼
               ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
               │ Send Warning    │    │ Show Green      │    │ Send Alert      │
               │ Notification    │    │ Status          │    │ Suggest Action  │
               └─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Budget Utilization Formula
```
Budget Utilization % = (Spent This Period / Budget Amount) × 100
```

#### Remaining Budget Calculation
```
Remaining Budget = Budget Amount - Spent This Period
```

### 11.4 Recurring Transaction Handling

#### Recurring Transaction Process
1. **Schedule Definition**: User defines frequency (daily, weekly, bi-weekly, monthly, yearly)
2. **Next Occurrence Calculation**: Calculate next transaction date based on frequency
3. **Automatic Generation**: System generates transactions on scheduled dates
4. **History Tracking**: Maintain record of all generated transactions

#### Frequency Logic
```
Monthly:    Same day each month (e.g., 15th)
Weekly:     Same day each week (e.g., every Monday)
Bi-weekly:  Every 2 weeks on same day
Yearly:     Same date each year
```

#### Recurring Transaction Schema
```
{
  "is_recurring": true,
  "recurring_frequency": "monthly",
  "recurring_day": 15,           // Day of month/week
  "recurring_end_date": null,    // null = never ends
  "occurrences": 12,             // Number of times to generate
  "last_generated": "2026-01-01",
  "next_generation": "2026-02-01"
}
```

### 11.5 Analytics & Insights Engine

#### Data Aggregation Pipeline
```
┌─────────────────────────────────────────────────────────────────────┐
│                         Analytics Pipeline                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│ Raw Data    │────▶│ Transform    │────▶│ Aggregate    │────▶│ Visualize   │
│ (Tables)    │     │ & Clean      │     │ & Calculate  │     │ & Report    │
└─────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
```

#### Key Metrics Calculated

**Income Metrics**:
- Total income (daily, weekly, monthly, yearly)
- Income by category/source
- Income trends over time
- Average income per period

**Expense Metrics**:
- Total expenses (daily, weekly, monthly, yearly)
- Expenses by category/merchant
- Top spending categories
- Expense trends and patterns

**Cash Flow Metrics**:
```
Cash Flow = Total Income - Total Expenses

Positive Cash Flow = Income > Expenses (Surplus)
Negative Cash Flow = Income < Expenses (Deficit)
```

**Savings Rate**:
```
Savings Rate % = ((Income - Expenses) / Income) × 100
```

**Budget Performance**:
- Budget adherence rate
- Category-wise spending comparison
- Budget variance analysis

### 11.6 Multi-Account Synchronization

#### Account Sync Process
1. **Manual Sync**: User triggers account refresh
2. **Transaction Import**: Fetch new transactions from account
3. **Deduplication**: Match imported transactions against existing
4. **Auto-categorization**: Assign categories based on merchant patterns
5. **Balance Update**: Update account balance after import

#### Transaction Matching Algorithm
```
1. Exact Match: Same amount, date, merchant
2. Fuzzy Match: Similar amount, same date range, similar merchant
3. Manual Review: Flag uncertain matches for user confirmation
```

### 11.7 Loan & Debt Tracking

#### Amortization Calculation
```
Monthly Payment = P × [r(1+r)^n] / [(1+r)^n - 1]

Where:
- P = Principal loan amount
- r = Monthly interest rate (annual rate / 12)
- n = Total number of payments (loan term in months)
```

#### Interest vs Principal Split
```
Interest Payment = Remaining Balance × Monthly Interest Rate
Principal Payment = Total Monthly Payment - Interest Payment
Remaining Balance = Previous Balance - Principal Payment
```

#### Payoff Date Calculation
```
Payoff Date = Loan Start Date + (Loan Term in Months)
Remaining Payments = Remaining Balance / Monthly Payment
```

### 11.8 Investment Portfolio Tracking

#### Portfolio Value Calculation
```
Portfolio Value = Sum of (Current Value × Quantity) for all investments

Total Return = Current Portfolio Value - Total Invested Amount
Return Percentage = ((Current Value - Invested Amount) / Invested Amount) × 100
```

#### Diversification Analysis
```
Allocation % = (Investment Type Value / Total Portfolio Value) × 100

Target Allocation: Stocks 60%, Bonds 30%, Cash 10%
Actual Allocation: Stocks 65%, Bonds 25%, Crypto 10%
```

### 11.9 Savings Goal Progress Tracking

#### Goal Progress Calculation
```
Progress % = (Current Amount / Target Amount) × 100

Estimated Completion Date = Target Date × (Current Amount / Target Amount)

Monthly Contribution Needed = (Target Amount - Current Amount) / Months Remaining
```

#### Milestone Tracking
```
Milestone 1: 25% complete - Celebrate achievement
Milestone 2: 50% complete - Halfway there!
Milestone 3: 75% complete - Almost done
Milestone 4: 100% complete - Goal achieved!
```

### 11.10 Data Flow Diagrams

#### Income Tracking Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                          Income Tracking                             │
└─────────────────────────────────────────────────────────────────────┘

User Input → Validation → Category Assignment → Database Storage
                                              │
                                              ▼
                              ┌──────────────────────────────┐
                              │ Update Dashboard Summary     │
                              │ - Monthly Income Total       │
                              │ - Income by Category         │
                              │ - Income Trend Chart         │
                              └──────────────────────────────┘
```

#### Expense Tracking Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│                          Expense Tracking                            │
└─────────────────────────────────────────────────────────────────────┘

User Input → Validation → Category Assignment → Receipt Upload
                                              │
                                              ▼
                              ┌──────────────────────────────┐
                              │ Update Dashboard Summary     │
                              │ - Monthly Expense Total      │
                              │ - Expense by Category        │
                              │ - Budget Utilization         │
                              │ - Cash Flow Status           │
                              └──────────────────────────────┘
                                              │
                                              ▼
                              ┌──────────────────────────────┐
                              │ Check Budget Alerts          │
                              │ - Near limit warnings        │
                              │ - Over budget notifications  │
                              └──────────────────────────────┘
```

### 11.11 Reporting & Export System

#### Report Generation Process
1. **Data Collection**: Aggregate data from all relevant tables
2. **Time Period Filtering**: Apply date range filters
3. **Calculation Engine**: Compute all metrics and totals
4. **Formatting**: Apply report template and styling
5. **Export**: Generate file (PDF, CSV, Excel) or display online

#### Report Types
- **Monthly Summary**: Income, expenses, savings for the month
- **Category Breakdown**: Spending by category with percentages
- **Trend Analysis**: Historical comparison (same period last year)
- **Budget Performance**: Actual vs budgeted spending
- **Net Worth Report**: Asset and liability summary

---

## 12. Security & Data Integrity

### 12.1 Data Validation
- All inputs sanitized and validated
- Amounts validated for positive values
- Dates validated for valid format and range
- Category references validated against user categories

### 12.2 Transaction Integrity
- ACID compliance for all financial transactions
- Atomic updates for balance calculations
- Audit logging for all changes
- Soft delete for recovery options

### 12.3 Data Consistency
- Foreign key constraints enforce referential integrity
- Cascade delete for user data removal
- Trigger-based updates for calculated fields
- Regular data integrity checks

---

## 13. Performance Optimization

### 13.1 Query Optimization
- Indexed fields for common queries (user_id, date ranges)
- Pagination for large transaction lists
- Cached summaries for dashboard
- Pre-calculated analytics data

### 13.2 Real-time Updates
- WebSocket connections for live balance updates
- Optimistic UI updates for immediate feedback
- Background processing for heavy calculations
- Lazy loading for historical data

---

This comprehensive design provides a detailed blueprint for implementing the finance tracking system, covering all aspects from transaction flow to advanced analytics.

---

This design document provides a comprehensive blueprint for building the Personal Financier application. It covers the architecture, database schema, API design, UI structure, and feature breakdown needed to create a robust personal finance management solution.
