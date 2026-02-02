import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../api';
import type { GetExpensesParams, CreateExpenseParams, UpdateExpenseParams } from '../api';

export const useExpenses = (params?: GetExpensesParams) => {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expenseApi.getExpenses(params),
  });
};

export const useExpense = (id: string) => {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => expenseApi.getExpenseById(id),
    enabled: !!id,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateExpenseParams) => expenseApi.createExpense(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateExpenseParams }) =>
      expenseApi.updateExpense(id, params),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expenseApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useExpenseSummary = (params?: { start_date?: string; end_date?: string }) => {
  return useQuery({
    queryKey: ['expenseSummary', params],
    queryFn: () => expenseApi.getSummary(params),
  });
};
