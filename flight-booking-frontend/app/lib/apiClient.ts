import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Concurrent 401s share a single in-flight refresh instead of each firing their
// own /auth/refresh call (which would race on the rotated refresh token).
let refreshPromise: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = useAuthStore.getState().refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      await refreshPromise;
    } catch {
      return Promise.reject(error);
    }

    return apiClient(originalRequest);
  }
);

export default apiClient;
