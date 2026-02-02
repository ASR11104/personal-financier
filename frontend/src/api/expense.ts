import { api } from './client';
import type { Expense, ExpenseSummaryResponse } from '../types';

export interface GetExpensesParams {
  start_date?: string;
  end_date?: string;
  category_id?: string;
  account_id?: string;
  limit?: number;
  offset?: number;
}

export interface CreateExpenseParams {
  account_id: string;
  category_id: string;
  sub_category_id?: string;
  amount: number;
  description?: string;
  expense_date: string;
}

export interface UpdateExpenseParams {
  amount?: number;
  description?: string;
  expense_date?: string;
}

export interface ExpenseListResponse {
  expenses: Expense[];
}

export const expenseApi = {
  getExpenses: async (params?: GetExpensesParams): Promise<ExpenseListResponse> => {
    const response = await api.get<ExpenseListResponse>('/expenses', { params });
    return response.data;
  },

  getExpenseById: async (id: string): Promise<{ expense: Expense }> => {
    const response = await api.get<{ expense: Expense }>(`/expenses/${id}`);
    return response.data;
  },

  createExpense: async (params: CreateExpenseParams): Promise<{ expense: Expense }> => {
    const response = await api.post<{ expense: Expense }>('/expenses', params);
    return response.data;
  },

  updateExpense: async (id: string, params: UpdateExpenseParams): Promise<{ expense: Expense }> => {
    const response = await api.put<{ expense: Expense }>(`/expenses/${id}`, params);
    return response.data;
  },

  deleteExpense: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/expenses/${id}`);
    return response.data;
  },

  getSummary: async (params?: { start_date?: string; end_date?: string }): Promise<ExpenseSummaryResponse> => {
    const response = await api.get<ExpenseSummaryResponse>('/expenses/summary', { params });
    return response.data;
  },
};
