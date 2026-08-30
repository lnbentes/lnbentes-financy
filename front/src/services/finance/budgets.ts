import { api } from '../api';
import type { Budget, BudgetSummary } from '../../types/finance';

export const budgetsService = {
  list: async (): Promise<Budget[]> => api.get('/api/budgets/'),
  get: async (id: string): Promise<Budget> => api.get(`/api/budgets/${id}/`),
  create: async (data: Partial<Budget>): Promise<Budget> => api.post('/api/budgets/', data),
  update: async (id: string, data: Partial<Budget>): Promise<Budget> => api.put(`/api/budgets/${id}/`, data),
  delete: async (id: string): Promise<void> => api.delete(`/api/budgets/${id}/`),
  summary: async (params?: { month?: number; year?: number }): Promise<BudgetSummary[]> => 
    api.get('/api/budgets/summary/', { params }),
};
