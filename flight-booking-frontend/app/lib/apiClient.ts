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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // refreshAccessToken() itself dedupes concurrent callers onto one
    // in-flight request, so it's safe to call directly here even if
    // something else (e.g. AuthBootstrap) is refreshing at the same time.
    try {
      await useAuthStore.getState().refreshAccessToken();
    } catch {
      return Promise.reject(error);
    }

    return apiClient(originalRequest);
  }
);

export default apiClient;
