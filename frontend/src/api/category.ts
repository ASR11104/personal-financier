import { api } from './client';
import type { Category, SubCategory } from '../types';

export interface CategoryResponse {
  categories: Category[];
}

export interface SubCategoryResponse {
  sub_categories: (SubCategory & { category_name?: string; category_type?: string })[];
}

export interface CreateCategoryParams {
  name: string;
  type: 'income' | 'expense' | 'transfer';
  description?: string;
}

export interface UpdateCategoryParams {
  name?: string;
  description?: string;
}

export interface CreateSubCategoryParams {
  category_id: string;
  name: string;
  description?: string;
}

export interface UpdateSubCategoryParams {
  name?: string;
  description?: string;
}

export const categoryApi = {
  // Categories
  getCategories: async (params?: { type?: string }): Promise<CategoryResponse> => {
    const response = await api.get<CategoryResponse>('/categories', { params });
    return response.data;
  },

  getCategoryById: async (id: string): Promise<{ category: Category }> => {
    const response = await api.get<{ category: Category }>(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (params: CreateCategoryParams): Promise<{ category: Category }> => {
    const response = await api.post<{ category: Category }>('/categories', params);
    return response.data;
  },

  updateCategory: async (id: string, params: UpdateCategoryParams): Promise<{ category: Category }> => {
    const response = await api.put<{ category: Category }>(`/categories/${id}`, params);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/categories/${id}`);
    return response.data;
  },

  // SubCategories
  getSubCategories: async (params?: { category_id?: string }): Promise<SubCategoryResponse> => {
    const response = await api.get<SubCategoryResponse>('/categories/sub-categories', { params });
    return response.data;
  },

  getSubCategoryById: async (id: string): Promise<{ sub_category: SubCategory & { category_name?: string } }> => {
    const response = await api.get<{ sub_category: SubCategory & { category_name?: string } }>(`/categories/sub-categories/${id}`);
    return response.data;
  },

  createSubCategory: async (params: CreateSubCategoryParams): Promise<{ sub_category: SubCategory }> => {
    const response = await api.post<{ sub_category: SubCategory }>('/categories/sub-categories', params);
    return response.data;
  },

  updateSubCategory: async (id: string, params: UpdateSubCategoryParams): Promise<{ sub_category: SubCategory }> => {
    const response = await api.put<{ sub_category: SubCategory }>(`/categories/sub-categories/${id}`, params);
    return response.data;
  },

  deleteSubCategory: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/categories/sub-categories/${id}`);
    return response.data;
  },
};
