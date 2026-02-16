import { api } from './client';

export interface FinancialPreferencesData {
    expected_retirement_age?: number;
    monthly_retirement_expense?: number | null;
    expected_annual_return?: number;
    expected_inflation_rate?: number;
    life_expectancy?: number;
}

export const financialPreferencesApi = {
    get: () => api.get('/financial-preferences').then(res => res.data),
    update: (data: FinancialPreferencesData) => api.put('/financial-preferences', data).then(res => res.data),
};
