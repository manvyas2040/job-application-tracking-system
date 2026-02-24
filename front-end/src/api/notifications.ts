import { api } from './client';

export type NotificationRow = {
  notification_id: number;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
};

export const listNotifications = async () => {
  const { data } = await api.get('/notifications');
  return data as NotificationRow[];
};

export const markNotificationRead = async (notificationId: number) => {
  const { data } = await api.patch(`/notifications/${notificationId}/read`);
  return data;
};
