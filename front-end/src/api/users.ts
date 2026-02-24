import { api } from './client';

export type UserRow = {
  user_id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  is_active: boolean;
};

export const listUsers = async (params: { role?: string; status?: string; page?: number; page_size?: number }) => {
  const { data } = await api.get('/users', { params });
  return data as { total: number; items: UserRow[] };
};

export const updateUser = async (userId: number, payload: Partial<{ name: string; email: string; status: string }>) => {
  const { data } = await api.patch(`/users/${userId}`, payload);
  return data;
};

export const changeRole = async (userId: number, newRole: string) => {
  const { data } = await api.post(`/users/${userId}/role`, { new_role: newRole });
  return data;
};

export const deactivateUser = async (userId: number) => {
  const { data } = await api.delete(`/users/${userId}`);
  return data;
};

export const restoreUser = async (userId: number) => {
  const { data } = await api.post(`/users/${userId}/restore`);
  return data;
};

export const getAuditLogs = async () => {
  const { data } = await api.get('/audit-logs');
  return data as Array<{ timestamp: string; user_id: number; action: string }>;
};
