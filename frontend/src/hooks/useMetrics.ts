import { useQuery } from '@tanstack/react-query';
import { metricsApi } from '../api/metrics';

export function useFinancialMetrics(months?: number) {
    return useQuery({
        queryKey: ['financial-metrics', months],
        queryFn: () => metricsApi.getFinancialMetrics(months),
    });
}
