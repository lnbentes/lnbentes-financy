import { api } from './api';
import type { User } from '../types/auth';

export const userService = {
  getProfile: async (id: number): Promise<User> => {
    return api.get<any, User>(`/api/users/${id}/`);
  },
  updateProfile: async (id: number, data: { first_name?: string; last_name?: string; email?: string }): Promise<User> => {
    return api.patch<any, User>(`/api/users/${id}/`, data);
  },
  changePassword: async (id: number, password: string): Promise<{ message: string }> => {
    return api.post<any, { message: string }>(`/api/users/${id}/reset-password/`, { password });
  },
};
