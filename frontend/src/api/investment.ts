import { api } from './client';
import type { Investment, InvestmentType } from '../types';

export interface GetInvestmentsParams {
  start_date?: string;
  end_date?: string;
  investment_type_id?: string;
  account_id?: string;
  status?: 'active' | 'sold' | 'withdrawn';
  is_sip?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateInvestmentParams {
  account_id: string;
  investment_type_id: string;
  name: string;
  amount: number;
  units?: string;
  purchase_price?: number;
  purchase_date: string;
  description?: string;
  // SIP fields
  is_sip?: boolean;
  sip_amount?: number;
  sip_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  sip_start_date?: string;
  sip_end_date?: string;
  sip_day_of_month?: number;
  sip_total_installments?: number;
  // Existing investment flag - skips account balance deduction
  is_existing?: boolean;
}

export interface UpdateInvestmentParams {
  name?: string;
  amount?: number;
  units?: string;
  purchase_price?: number;
  purchase_date?: string;
  description?: string;
  investment_type_id?: string;
  // SIP fields
  is_sip?: boolean;
  sip_amount?: number;
  sip_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  sip_start_date?: string;
  sip_end_date?: string;
  sip_day_of_month?: number;
  sip_total_installments?: number;
}

export interface WithdrawInvestmentParams {
  target_account_id: string;
  withdrawal_amount?: number;
  withdrawal_date?: string;
  description?: string;
}

export interface SipTransaction {
  id: string;
  investment_id: string;
  account_id: string;
  expense_id: string | null;
  amount: number;
  transaction_date: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  processed_at: string | null;
}

export interface InvestmentWithSip extends Investment {
  sip_transactions?: SipTransaction[];
  sip_transactions_count?: number;
}

export const investmentApi = {
  getInvestments: async (params?: GetInvestmentsParams): Promise<{ investments: InvestmentWithSip[] }> => {
    const response = await api.get<{ investments: InvestmentWithSip[] }>('/investments', { params });
    return response.data;
  },

  getInvestmentById: async (id: string): Promise<{ investment: InvestmentWithSip }> => {
    const response = await api.get<{ investment: InvestmentWithSip }>(`/investments/${id}`);
    return response.data;
  },

  createInvestment: async (params: CreateInvestmentParams): Promise<{ investment: Investment }> => {
    const response = await api.post<{ investment: Investment }>('/investments', params);
    return response.data;
  },

  updateInvestment: async (id: string, params: UpdateInvestmentParams): Promise<{ investment: Investment }> => {
    const response = await api.put<{ investment: Investment }>(`/investments/${id}`, params);
    return response.data;
  },

  deleteInvestment: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/investments/${id}`);
    return response.data;
  },

  processSipPayment: async (
    id: string,
    params?: { transaction_date?: string }
  ): Promise<{ message: string; investment: Investment }> => {
    const response = await api.post<{ message: string; investment: Investment }>(
      `/investments/${id}/process-sip`,
      params
    );
    return response.data;
  },

  withdrawInvestment: async (
    id: string,
    params: WithdrawInvestmentParams
  ): Promise<{ message: string; income: any; investment: Investment }> => {
    const response = await api.post<{ message: string; income: any; investment: Investment }>(
      `/investments/${id}/withdraw`,
      params
    );
    return response.data;
  },

  getSummary: async (params?: { start_date?: string; end_date?: string }): Promise<{
    summary: { total_count: number; total_amount: number };
    by_type: { investment_type: string; total: number; count: number }[];
    by_status: { status: string; count: number; total: number }[];
    sip_summary: { total_sips: number; total_sip_amount: number; total_installments: number };
  }> => {
    const response = await api.get('/investments/summary', { params });
    return response.data;
  },

  getTypes: async (): Promise<{ investment_types: InvestmentType[] }> => {
    const response = await api.get<{ investment_types: InvestmentType[] }>('/investments/types');
    return response.data;
  },
};
