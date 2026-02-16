export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  default_currency?: string;
  timezone?: string;
  created_at?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  marital_status?: string;
  number_of_dependants?: number;
  country?: string;
  state?: string;
  district?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AccountDetails {
  id: string;
  account_id: string;
  credit_limit?: number;
  available_credit?: number;
  loan_amount?: number;
  loan_balance?: number;
  interest_rate?: number;
  loan_term_months?: number;
  loan_start_date?: string;
  loan_due_date?: string;
  current_monthly_payment?: number;
}

export interface LoanProjection {
  id: string;
  name: string;
  balance?: number;
  loan_balance?: number;
  loan_amount?: number;
  interest_rate?: number;
  current_monthly_payment?: number;
  months_to_payoff?: number;
  payoff_date?: string | null;
  is_paid_off: boolean;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'loan';
  currency: string;
  balance: number;
  institution_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  details?: AccountDetails;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  description?: string;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  recurring_expense_id?: string;
  amount: number;
  description?: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  category_name?: string;
  account_name?: string;
  tags?: Tag[];
  credit_card_account_id?: string;
  loan_account_id?: string;
}

export interface ExpenseSummary {
  total_count: number;
  total_amount: number;
}

export interface ExpenseSummaryResponse {
  summary: ExpenseSummary;
  by_category: Array<{ category: string; total: number }>;
}

export interface AccountBalance {
  total_balance: number;
  checking: number;
  savings: number;
  credit_card: number;
  cash: number;
  investment: number;
  loan: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface Income {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: number;
  description?: string;
  income_date: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  category_name?: string;
  account_name?: string;
  tags?: Tag[];
}

export interface IncomeSummary {
  total_count: number;
  total_amount: number;
}

export interface IncomeSummaryResponse {
  summary: IncomeSummary;
  by_category: Array<{ category: string; total: number }>;
}

export interface InvestmentType {
  id: string;
  name: string;
  description?: string;
}

export interface Investment {
  id: string;
  user_id: string;
  account_id: string;
  investment_type_id: string;
  name: string;
  amount: number;
  units?: string;
  purchase_price?: number;
  purchase_date: string;
  description?: string;
  status: 'active' | 'sold' | 'withdrawn';
  withdrawal_amount?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  investment_type_name?: string;
  account_name?: string;
  // SIP fields
  is_sip?: boolean;
  sip_amount?: number;
  sip_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  sip_start_date?: string;
  sip_end_date?: string;
  sip_day_of_month?: number;
  sip_installments_completed?: number;
  sip_total_installments?: number;
  sip_transactions_count?: number;
  // Current amount after partial withdrawals
  current_amount?: number;
  // Emergency fund flag
  is_emergency_fund?: boolean;
}

export interface InvestmentSummary {
  total_count: number;
  total_amount: number;
}

export interface InvestmentSummaryResponse {
  summary: InvestmentSummary;
  by_type: Array<{ investment_type: string; total: number; count: number }>;
  by_status: Array<{ status: string; count: number; total: number }>;
}

// Financial Preferences
export interface FinancialPreferences {
  id?: string;
  user_id?: string;
  expected_retirement_age: number;
  monthly_retirement_expense: number | null;
  expected_annual_return: number;
  expected_inflation_rate: number;
  life_expectancy: number;
}

// Financial Metrics
export interface AdviceItem {
  type: 'warning' | 'tip' | 'positive';
  category: 'spending' | 'savings' | 'debt' | 'retirement' | 'investment' | 'emergency';
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SpendingHabits {
  total_expenses: number;
  avg_daily_spend: number;
  avg_monthly_spend: number;
  highest_spending_day: { day: string; day_of_week: number; total: number } | null;
  spending_by_day: Array<{ day: string; day_of_week: number; total: number }>;
  weekend_spend: number;
  weekday_spend: number;
  weekend_vs_weekday_ratio: number;
  top_categories: Array<{ category: string; total: number }>;
  monthly_totals: Array<{ month: string; total: number }>;
  mom_change: number | null;
}

export interface SavingsTracker {
  current_savings_rate: number;
  avg_savings_rate: number;
  trend: 'improving' | 'declining' | 'stable';
  total_income: number;
  total_expenses: number;
  total_savings: number;
  avg_monthly_savings: number;
  projected_annual_savings: number;
  monthly_data: Array<{ month: string; income: number; expense: number; savings: number; savings_rate: number }>;
}

export interface RetirementPlanning {
  configured: boolean;
  current_age: number | null;
  retirement_age: number;
  life_expectancy?: number;
  years_to_retirement: number;
  years_in_retirement?: number;
  expected_annual_return?: number;
  expected_inflation_rate?: number;
  monthly_retirement_expense?: number;
  current_corpus: number;
  required_corpus: number;
  projected_corpus: number;
  monthly_investment_needed: number;
  retirement_readiness: number;
  gap?: number;
  message?: string;
}

export interface HealthScoreBreakdownItem {
  score: number;
  weight: number;
  value: number;
  target: number;
}

export interface FinancialHealthScore {
  total_score: number;
  grade: string;
  breakdown: {
    savings_rate: HealthScoreBreakdownItem;
    debt_to_income: HealthScoreBreakdownItem;
    emergency_fund: HealthScoreBreakdownItem;
    credit_utilization: HealthScoreBreakdownItem;
    investment_rate: HealthScoreBreakdownItem;
  };
}

export interface EmergencyFund {
  current_fund: number;
  account_balance: number;
  emergency_investments: number;
  avg_monthly_expenses: number;
  months_of_coverage: number;
  target: number;
  gap: number;
  status: 'healthy' | 'building' | 'critical';
}

export interface DebtToIncome {
  total_monthly_debt: number;
  loan_payments: number;
  credit_card_min_payments: number;
  avg_monthly_income: number;
  dti_ratio: number;
  status: string;
}

export interface ExpenseForecast {
  projected_next_month: number;
  historical: Array<{ month: string; total: number }>;
  category_projections: Array<{ category: string; avg_monthly: number; total: number }>;
}

export interface FinancialMetricsResponse {
  spending_habits: SpendingHabits;
  savings_tracker: SavingsTracker;
  retirement_planning: RetirementPlanning;
  financial_health_score: FinancialHealthScore;
  emergency_fund: EmergencyFund;
  debt_to_income: DebtToIncome;
  expense_forecast: ExpenseForecast;
  advice: AdviceItem[];
}
