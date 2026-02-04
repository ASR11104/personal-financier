import { api, setToken, setRefreshToken, removeToken, removeRefreshToken } from './client';
import type { AuthResponse, User } from '../types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  default_currency?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  marital_status?: string;
  number_of_dependants?: number;
  country?: string;
  state?: string;
  district?: string;
}

export interface UpdateProfileParams {
  first_name?: string;
  last_name?: string;
  default_currency?: string;
  timezone?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  marital_status?: string;
  number_of_dependants?: number;
  country?: string;
  state?: string;
  district?: string;
}

export const authApi = {
  login: async (params: LoginParams): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', params);
    setToken(response.data.token);
    setRefreshToken(response.data.refreshToken);
    return response.data;
  },

  register: async (params: RegisterParams): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', params);
    setToken(response.data.token);
    setRefreshToken(response.data.refreshToken);
    return response.data;
  },

  logout: () => {
    removeToken();
    removeRefreshToken();
  },

  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/profile');
    return response.data;
  },

  updateProfile: async (params: UpdateProfileParams): Promise<{ user: User }> => {
    const response = await api.put<{ user: User }>('/auth/profile', params);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await api.post<{ token: string }>('/auth/refresh', { refreshToken });
    setToken(response.data.token);
    return response.data;
  },
};
