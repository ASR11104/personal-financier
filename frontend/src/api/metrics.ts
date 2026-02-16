import { api } from './client';

export const metricsApi = {
    getFinancialMetrics: (months?: number) =>
        api.get('/metrics', { params: { months } }).then(res => res.data),
};
