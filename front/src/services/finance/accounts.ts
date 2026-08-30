import { api } from '../api';
import type { Account } from '../../types/finance';

export const accountsService = {
  list: async (): Promise<Account[]> => api.get('/api/accounts/'),
  create: async (data: Partial<Account>): Promise<Account> => api.post('/api/accounts/', data),
  update: async (id: string, data: Partial<Account>): Promise<Account> => api.put(`/api/accounts/${id}/`, data),
  delete: async (id: string): Promise<void> => api.delete(`/api/accounts/${id}/`),
};
