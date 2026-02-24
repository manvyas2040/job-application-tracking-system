import { api } from './client';

export type LoginPayload = {
  email: string;
  password: string;
};

export const login = async (payload: LoginPayload) => {
  const { data } = await api.post('/auth/login', payload);
  return data as { access_token: string; refresh_token: string; token_type: string };
};
