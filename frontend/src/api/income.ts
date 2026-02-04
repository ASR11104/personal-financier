import { api } from './client';
import type { Income, IncomeSummaryResponse } from '../types';

export interface GetIncomesParams {
  start_date?: string;
  end_date?: string;
  category_id?: string;
  account_id?: string;
  tag_id?: string;
  limit?: number;
  offset?: number;
}

export interface CreateIncomeParams {
  account_id: string;
  category_id: string;
  amount: number;
  description?: string;
  income_date: string;
  tag_ids?: string[];
}

export interface UpdateIncomeParams {
  amount?: number;
  description?: string;
  income_date?: string;
  category_id?: string;
  tag_ids?: string[];
}

export interface IncomeListResponse {
  incomes: Income[];
}

export const incomeApi = {
  getIncomes: async (params?: GetIncomesParams): Promise<IncomeListResponse> => {
    const response = await api.get<IncomeListResponse>('/incomes', { params });
    return response.data;
  },

  getIncomeById: async (id: string): Promise<{ income: Income }> => {
    const response = await api.get<{ income: Income }>(`/incomes/${id}`);
    return response.data;
  },

  createIncome: async (params: CreateIncomeParams): Promise<{ income: Income }> => {
    const response = await api.post<{ income: Income }>('/incomes', params);
    return response.data;
  },

  updateIncome: async (id: string, params: UpdateIncomeParams): Promise<{ income: Income }> => {
    const response = await api.put<{ income: Income }>(`/incomes/${id}`, params);
    return response.data;
  },

  deleteIncome: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/incomes/${id}`);
    return response.data;
  },

  getSummary: async (params?: { start_date?: string; end_date?: string }): Promise<IncomeSummaryResponse> => {
    const response = await api.get<IncomeSummaryResponse>('/incomes/summary', { params });
    return response.data;
  },
};
