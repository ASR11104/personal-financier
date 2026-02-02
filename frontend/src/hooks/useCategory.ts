import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api/category';
import type { CreateCategoryParams, UpdateCategoryParams, CreateSubCategoryParams, UpdateSubCategoryParams } from '../api/category';

export const useCategories = (params?: { type?: string }) => {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => categoryApi.getCategories(params),
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => categoryApi.getCategoryById(id),
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateCategoryParams) => categoryApi.createCategory(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateCategoryParams }) =>
      categoryApi.updateCategory(id, params),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

// SubCategories
export const useSubCategories = (params?: { category_id?: string }) => {
  return useQuery({
    queryKey: ['subCategories', params],
    queryFn: () => categoryApi.getSubCategories(params),
  });
};

export const useSubCategory = (id: string) => {
  return useQuery({
    queryKey: ['subCategory', id],
    queryFn: () => categoryApi.getSubCategoryById(id),
    enabled: !!id,
  });
};

export const useCreateSubCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateSubCategoryParams) => categoryApi.createSubCategory(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subCategories'] });
    },
  });
};

export const useUpdateSubCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateSubCategoryParams }) =>
      categoryApi.updateSubCategory(id, params),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['subCategories'] });
      queryClient.invalidateQueries({ queryKey: ['subCategory', id] });
    },
  });
};

export const useDeleteSubCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryApi.deleteSubCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subCategories'] });
    },
  });
};
