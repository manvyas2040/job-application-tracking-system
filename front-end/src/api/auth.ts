import { api } from './client';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: string;
  status?: string;
};

export const login = async (payload: LoginPayload) => {
  const { data } = await api.post('/auth/login', payload);
  return data as { access_token: string; refresh_token: string; token_type: string };
};

export const register = async (payload: RegisterPayload) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};
