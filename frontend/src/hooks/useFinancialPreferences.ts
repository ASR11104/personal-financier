import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialPreferencesApi, type FinancialPreferencesData } from '../api/financialPreferences';

export function useFinancialPreferences() {
    return useQuery({
        queryKey: ['financial-preferences'],
        queryFn: financialPreferencesApi.get,
    });
}

export function useUpdateFinancialPreferences() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: FinancialPreferencesData) => financialPreferencesApi.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-preferences'] });
            queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
        },
    });
}
