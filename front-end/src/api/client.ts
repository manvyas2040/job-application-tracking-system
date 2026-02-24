import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_BASE,
});

let accessToken: string | null = null;
let onAuthFailure: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const setAuthFailureHandler = (handler: (() => void) | null) => {
  onAuthFailure = handler;
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
  const nextAccess = response.data.access_token as string;
  const nextRefresh = response.data.refresh_token as string;
  localStorage.setItem('access_token', nextAccess);
  localStorage.setItem('refresh_token', nextRefresh);
  setAccessToken(nextAccess);
  return nextAccess;
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      try {
        const nextAccess = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${nextAccess}`;
        return api(original);
      } catch {
        setAccessToken(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        onAuthFailure?.();
      }
    }
    throw error;
  }
);
