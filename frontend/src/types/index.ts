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
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan';
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
