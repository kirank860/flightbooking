import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
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
    if (error.response?.status === 401) {
      const { refreshAccessToken } = useAuthStore.getState();
      await refreshAccessToken();
      return apiClient(error.config!);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
