import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi } from '../api';
import type { CreateAccountParams, UpdateAccountParams } from '../api';

export const useAccounts = (params?: { type?: string; is_active?: boolean }) => {
  return useQuery({
    queryKey: ['accounts', params],
    queryFn: () => accountApi.getAccounts(params),
  });
};

export const useAccount = (id: string) => {
  return useQuery({
    queryKey: ['account', id],
    queryFn: () => accountApi.getAccountById(id),
    enabled: !!id,
  });
};

export const useAccountBalance = () => {
  return useQuery({
    queryKey: ['accountBalance'],
    queryFn: () => accountApi.getAccountBalance(),
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateAccountParams) => accountApi.createAccount(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['accountBalance'] });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateAccountParams }) =>
      accountApi.updateAccount(id, params),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', id] });
      queryClient.invalidateQueries({ queryKey: ['accountBalance'] });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['accountBalance'] });
    },
  });
};

export const useReactivateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountApi.reactivateAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['accountBalance'] });
    },
  });
};
