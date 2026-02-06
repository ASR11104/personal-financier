import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api';

export const useExpenseTrends = (months: number = 12) => {
  return useQuery({
    queryKey: ['expenseTrends', months],
    queryFn: () => analyticsApi.getExpenseTrends(months),
  });
};

export const useIncomeTrends = (months: number = 12) => {
  return useQuery({
    queryKey: ['incomeTrends', months],
    queryFn: () => analyticsApi.getIncomeTrends(months),
  });
};

export const useIncomeVsExpense = (months: number = 12, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['incomeVsExpense', months, startDate, endDate],
    queryFn: () => analyticsApi.getIncomeVsExpense(months, startDate, endDate),
  });
};

export const useAccountAnalytics = () => {
  return useQuery({
    queryKey: ['accountAnalytics'],
    queryFn: () => analyticsApi.getAccountAnalytics(),
  });
};

export const useSpendingByDay = (months: number = 6) => {
  return useQuery({
    queryKey: ['spendingByDay', months],
    queryFn: () => analyticsApi.getSpendingByDay(months),
  });
};

export const useSpendingByTags = (months: number = 12) => {
  return useQuery({
    queryKey: ['spendingByTags', months],
    queryFn: () => analyticsApi.getSpendingByTags(months),
  });
};

export const useIncomeByTags = (months: number = 12) => {
  return useQuery({
    queryKey: ['incomeByTags', months],
    queryFn: () => analyticsApi.getIncomeByTags(months),
  });
};

export const useInvestmentOverview = () => {
  return useQuery({
    queryKey: ['investmentOverview'],
    queryFn: () => analyticsApi.getInvestmentOverview(),
  });
};

export const useInvestmentTrends = (months: number = 12) => {
  return useQuery({
    queryKey: ['investmentTrends', months],
    queryFn: () => analyticsApi.getInvestmentTrends(months),
  });
};

export const useInvestmentPerformance = () => {
  return useQuery({
    queryKey: ['investmentPerformance'],
    queryFn: () => analyticsApi.getInvestmentPerformance(),
  });
};
