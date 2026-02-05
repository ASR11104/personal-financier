import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, getToken, setToken } from '../api';
import type { LoginParams, RegisterParams, UpdateProfileParams } from '../api';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: LoginParams) => authApi.login(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      navigate('/dashboard');
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: RegisterParams) => authApi.register(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      navigate('/dashboard');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    authApi.logout();
    queryClient.clear();
    // Use window.location.href to ensure a clean redirect
    window.location.href = '/login';
  };
};

export const useProfile = (enabled = true) => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    enabled: enabled && !!getToken(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateProfileParams) => authApi.updateProfile(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: (refreshToken: string) => authApi.refreshToken(refreshToken),
    onSuccess: ({ token }) => {
      setToken(token);
    },
  });
};
