import { api } from './client';

export interface MonthlyTrendData {
  month: string;
  total: number;
  count?: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
}

export interface IncomeVsExpenseComparison {
  month: string;
  income: number;
  expense: number;
  net: number;
  savings_rate: number;
}

export interface IncomeVsExpenseSummary {
  total_income: number;
  total_expense: number;
  net_savings: number;
  overall_savings_rate: number;
}

export interface SpendingByDay {
  day_name: string;
  day_of_week: number;
  total: number;
  count: number;
}

export interface AccountAnalytics {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  breakdown: {
    assets: {
      checking_savings_cash: number;
      investment_accounts: number;
      investment_holdings: number;
    };
    liabilities: {
      credit_cards: number;
      loans: number;
    };
  };
  creditCards: {
    total_limit: number;
    total_used: number;
    total_available: number;
    utilization_percentage: number;
    cards: Array<{
      id: string;
      name: string;
      balance: number;
      credit_limit: number;
      available_credit: number;
      utilization: number;
    }>;
  };
  loans: {
    total_balance: number;
    total_original_amount: number;
    count: number;
    accounts: Array<{
      id: string;
      name: string;
      balance: number;
      loan_balance: number;
      loan_amount: number;
      interest_rate: number | null;
    }>;
  };
  by_type: Array<{
    type: string;
    count: number;
    total_balance: number;
  }>;
}

export interface MonthlyTrendsResponse {
  monthly_expenses: MonthlyTrendData[];
  by_category: CategoryBreakdown[];
}

export interface IncomeTrendsResponse {
  monthly_incomes: MonthlyTrendData[];
  by_category: CategoryBreakdown[];
}

export interface IncomeVsExpenseResponse {
  comparison: IncomeVsExpenseComparison[];
  summary: IncomeVsExpenseSummary;
}

export interface SpendingByDayResponse {
  by_day: SpendingByDay[];
  category_by_day: Array<{ category: string; day_name: string; total: number }>;
}

export interface TagSpending {
  tag_id: string;
  tag_name: string;
  tag_color: string;
  total: number;
  count: number;
}

export interface MonthlyTagSpending {
  month: string;
  tag_id: string;
  tag_name: string;
  tag_color: string;
  total: number;
}

export interface CategoryTagSpending {
  category: string;
  tag_id: string;
  tag_name: string;
  tag_color: string;
  total: number;
}

export interface SpendingByTagsResponse {
  by_tags: TagSpending[];
  monthly_by_tags: MonthlyTagSpending[];
  category_by_tags: CategoryTagSpending[];
}

export interface IncomeByTagsResponse {
  by_tags: TagSpending[];
  monthly_by_tags: MonthlyTagSpending[];
}

export interface InvestmentOverview {
  summary: {
    total_investments: number;
    total_invested: number;
    current_value: number;
    total_returns: number;
    returns_percentage: number;
  };
  by_status: {
    status: string;
    count: number;
    total_amount: number;
  }[];
  by_type: {
    investment_type: string;
    count: number;
    current_value: number;
    invested: number;
  }[];
  sip_summary: {
    total_sips: number;
    total_sip_amount: number;
    total_installments: number;
  };
}

export interface InvestmentTrendData {
  month: string;
  total: number;
  count?: number;
}

export interface InvestmentTrendsResponse {
  monthly_investments: InvestmentTrendData[];
  by_type_monthly: {
    month: string;
    investment_type: string;
    total: number;
    count: number;
  }[];
  sip_transactions: InvestmentTrendData[];
}

export interface InvestmentPerformance {
  type: string;
  count: number;
  total_invested: number;
  current_value: number;
  total_returns: number;
  returns_percentage: number;
  top_performers: {
    id: string;
    name: string;
    invested: number;
    current_value: number;
    returns: number;
    returns_percentage: number;
    purchase_date: string;
    status: string;
  }[];
}

export interface InvestmentPerformanceResponse {
  performance: InvestmentPerformance[];
}

export const analyticsApi = {
  // Get monthly expense trends
  getExpenseTrends: async (months: number = 12): Promise<MonthlyTrendsResponse> => {
    const response = await api.get<MonthlyTrendsResponse>('/analytics/expense-trends', {
      params: { months },
    });
    return response.data;
  },

  // Get monthly income trends
  getIncomeTrends: async (months: number = 12): Promise<IncomeTrendsResponse> => {
    const response = await api.get<IncomeTrendsResponse>('/analytics/income-trends', {
      params: { months },
    });
    return response.data;
  },

  // Get income vs expense comparison
  getIncomeVsExpense: async (months: number = 12): Promise<IncomeVsExpenseResponse> => {
    const response = await api.get<IncomeVsExpenseResponse>('/analytics/income-vs-expense', {
      params: { months },
    });
    return response.data;
  },

  // Get account analytics (net worth, debt, etc.)
  getAccountAnalytics: async (): Promise<AccountAnalytics> => {
    const response = await api.get<AccountAnalytics>('/analytics/accounts');
    return response.data;
  },

  // Get spending by day of week
  getSpendingByDay: async (months: number = 6): Promise<SpendingByDayResponse> => {
    const response = await api.get<SpendingByDayResponse>('/analytics/spending-by-day', {
      params: { months },
    });
    return response.data;
  },

  // Get spending by tags
  getSpendingByTags: async (months: number = 12): Promise<SpendingByTagsResponse> => {
    const response = await api.get<SpendingByTagsResponse>('/analytics/spending-by-tags', {
      params: { months },
    });
    return response.data;
  },

  // Get income by tags
  getIncomeByTags: async (months: number = 12): Promise<IncomeByTagsResponse> => {
    const response = await api.get<IncomeByTagsResponse>('/analytics/income-by-tags', {
      params: { months },
    });
    return response.data;
  },

  // Get investment overview
  getInvestmentOverview: async (): Promise<InvestmentOverview> => {
    const response = await api.get<InvestmentOverview>('/analytics/investments/overview');
    return response.data;
  },

  // Get investment trends
  getInvestmentTrends: async (months: number = 12): Promise<InvestmentTrendsResponse> => {
    const response = await api.get<InvestmentTrendsResponse>('/analytics/investments/trends', {
      params: { months },
    });
    return response.data;
  },

  // Get investment performance
  getInvestmentPerformance: async (): Promise<InvestmentPerformanceResponse> => {
    const response = await api.get<InvestmentPerformanceResponse>('/analytics/investments/performance');
    return response.data;
  },
};
