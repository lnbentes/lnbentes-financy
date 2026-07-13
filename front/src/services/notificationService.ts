import { api } from './api';
import type { RegistrationRequestData } from './registrationService';

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  registration_request: number | null;
  registration_request_detail: (RegistrationRequestData & { id: number; status: string; created_at: string }) | null;
  created_at: string;
}

export const notificationService = {
  list: async (): Promise<NotificationData[]> => {
    return api.get('/api/notifications/');
  },
  read: async (id: number): Promise<NotificationData> => {
    return api.post(`/api/notifications/${id}/read/`);
  },
  readAll: async (): Promise<{ message: string }> => {
    return api.post('/api/notifications/read-all/');
  },
};
