import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investmentApi } from '../api/investment';
import type { Investment, InvestmentType } from '../types';

export const useInvestments = (params?: Parameters<typeof investmentApi.getInvestments>[0]) => {
  return useQuery({
    queryKey: ['investments', params],
    queryFn: () => investmentApi.getInvestments(params),
  });
};

export const useInvestment = (id: string) => {
  return useQuery({
    queryKey: ['investment', id],
    queryFn: () => investmentApi.getInvestmentById(id),
    enabled: !!id,
  });
};

export const useCreateInvestment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof investmentApi.createInvestment>[0]) =>
      investmentApi.createInvestment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useUpdateInvestment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof investmentApi.updateInvestment>[1];
    }) => investmentApi.updateInvestment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment', id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useDeleteInvestment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => investmentApi.deleteInvestment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useProcessSipPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data?: Parameters<typeof investmentApi.processSipPayment>[1];
    }) => investmentApi.processSipPayment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment', id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useWithdrawInvestment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof investmentApi.withdrawInvestment>[1];
    }) => investmentApi.withdrawInvestment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investment', id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
};

export const useInvestmentSummary = (params?: { start_date?: string; end_date?: string }) => {
  return useQuery({
    queryKey: ['investment-summary', params],
    queryFn: () => investmentApi.getSummary(params),
    enabled: !!params?.start_date && !!params?.end_date,
  });
};

export const useInvestmentTypes = () => {
  return useQuery({
    queryKey: ['investment-types'],
    queryFn: () => investmentApi.getTypes(),
  });
};
