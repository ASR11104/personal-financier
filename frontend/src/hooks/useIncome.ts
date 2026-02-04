import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incomeApi } from '../api';
import type { GetIncomesParams, CreateIncomeParams, UpdateIncomeParams } from '../api';

export const useIncomes = (params?: GetIncomesParams) => {
  return useQuery({
    queryKey: ['incomes', params],
    queryFn: () => incomeApi.getIncomes(params),
  });
};

export const useIncome = (id: string) => {
  return useQuery({
    queryKey: ['income', id],
    queryFn: () => incomeApi.getIncomeById(id),
    enabled: !!id,
  });
};

export const useCreateIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateIncomeParams) => incomeApi.createIncome(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useUpdateIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateIncomeParams }) =>
      incomeApi.updateIncome(id, params),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['income', id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => incomeApi.deleteIncome(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useIncomeSummary = (params?: { start_date?: string; end_date?: string }) => {
  return useQuery({
    queryKey: ['incomeSummary', params],
    queryFn: () => incomeApi.getSummary(params),
  });
};
