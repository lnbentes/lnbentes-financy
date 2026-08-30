import { api } from '../api';
import type { Category } from '../../types/finance';

export const categoriesService = {
  list: async (): Promise<Category[]> => api.get('/api/categories/'),
  create: async (data: Partial<Category>): Promise<Category> => api.post('/api/categories/', data),
  update: async (id: string, data: Partial<Category>): Promise<Category> => api.put(`/api/categories/${id}/`, data),
  delete: async (id: string): Promise<void> => api.delete(`/api/categories/${id}/`),
};
