import { api } from './client';
import type { Category, Tag } from '../types';

export interface CategoryResponse {
  categories: Category[];
}

export interface TagResponse {
  tags: Tag[];
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

export interface CreateTagParams {
  name: string;
  color?: string;
}

export interface UpdateTagParams {
  name?: string;
  color?: string;
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

  // Tags (replaces SubCategories)
  getTags: async (params?: { search?: string }): Promise<TagResponse> => {
    const response = await api.get<TagResponse>('/categories/tags', { params });
    return response.data;
  },

  getTagById: async (id: string): Promise<{ tag: Tag }> => {
    const response = await api.get<{ tag: Tag }>(`/categories/tags/${id}`);
    return response.data;
  },

  createTag: async (params: CreateTagParams): Promise<{ tag: Tag }> => {
    const response = await api.post<{ tag: Tag }>('/categories/tags', params);
    return response.data;
  },

  updateTag: async (id: string, params: UpdateTagParams): Promise<{ tag: Tag }> => {
    const response = await api.put<{ tag: Tag }>(`/categories/tags/${id}`, params);
    return response.data;
  },

  deleteTag: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/categories/tags/${id}`);
    return response.data;
  },
};
