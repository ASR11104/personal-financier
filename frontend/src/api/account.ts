import { api } from './client';
import type { Account, AccountBalance } from '../types';

export interface CreateAccountParams {
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan';
  currency: string;
  institution_name?: string;
  balance?: number;
}

export interface UpdateAccountParams {
  name?: string;
  type?: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan';
  currency?: string;
  institution_name?: string;
  is_active?: boolean;
  balance?: number;
}

export interface AccountListResponse {
  accounts: Account[];
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
};
