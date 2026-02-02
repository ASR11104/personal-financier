export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  default_currency?: string;
  timezone?: string;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
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
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  description?: string;
  created_at: string;
}

export interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  sub_category_id?: string;
  recurring_expense_id?: string;
  amount: number;
  description?: string;
  expense_date: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  category_name?: string;
  sub_category_name?: string;
  account_name?: string;
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
