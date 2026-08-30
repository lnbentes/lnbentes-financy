import { api } from '../api';
import type { RecurringTransaction } from '../../types/finance';

export const recurringService = {
  list: async (): Promise<RecurringTransaction[]> => api.get('/api/recurring/'),
  get: async (id: string): Promise<RecurringTransaction> => api.get(`/api/recurring/${id}/`),
  create: async (data: Partial<RecurringTransaction>): Promise<RecurringTransaction> => api.post('/api/recurring/', data),
  update: async (id: string, data: Partial<RecurringTransaction>): Promise<RecurringTransaction> => api.put(`/api/recurring/${id}/`, data),
  delete: async (id: string): Promise<void> => api.delete(`/api/recurring/${id}/`),
  processPending: async (targetDate?: string): Promise<{ processed_count: number; transactions: string[] }> => 
    api.post('/api/recurring/process-pending/', { target_date: targetDate }),
};
