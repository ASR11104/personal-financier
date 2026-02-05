import { api } from './client';
import type { Account, AccountBalance } from '../types';

export interface AccountDetailsParams {
  credit_limit?: number;
  available_credit?: number;
  loan_amount?: number;
  loan_balance?: number;
  interest_rate?: number;
  loan_term_months?: number;
  loan_start_date?: string;
  loan_due_date?: string;
}

export interface CreateAccountParams {
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'loan';
  currency: string;
  institution_name?: string;
  balance?: number;
  details?: AccountDetailsParams;
}

export interface UpdateAccountParams {
  name?: string;
  type?: 'checking' | 'savings' | 'credit_card' | 'cash' | 'loan';
  currency?: string;
  institution_name?: string;
  is_active?: boolean;
  balance?: number;
  details?: AccountDetailsParams;
}

export interface AccountListResponse {
  accounts: Account[];
}

export interface AccountResponse {
  account: Account;
}

export interface AccountBalanceResponse {
  balances: AccountBalance;
}

export const accountApi = {
  getAccounts: async (params?: { type?: string; is_active?: boolean }): Promise<AccountListResponse> => {
    const response = await api.get<AccountListResponse>('/accounts', { params });
    return response.data;
  },

  getAccountById: async (id: string): Promise<{ account: Account }> => {
    const response = await api.get<{ account: Account }>(`/accounts/${id}`);
    return response.data;
  },

  getAccountBalance: async (): Promise<AccountBalanceResponse> => {
    const response = await api.get<AccountBalanceResponse>('/accounts/balance');
    return response.data;
  },

  createAccount: async (params: CreateAccountParams): Promise<{ account: Account }> => {
    const response = await api.post<{ account: Account }>('/accounts', params);
    return response.data;
  },

  updateAccount: async (id: string, params: UpdateAccountParams): Promise<{ account: Account }> => {
    const response = await api.put<{ account: Account }>(`/accounts/${id}`, params);
    return response.data;
  },

  deleteAccount: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/accounts/${id}`);
    return response.data;
  },

  reactivateAccount: async (id: string): Promise<{ account: Account; message: string }> => {
    const response = await api.post<{ account: Account; message: string }>(`/accounts/${id}/reactivate`);
    return response.data;
  },
};
