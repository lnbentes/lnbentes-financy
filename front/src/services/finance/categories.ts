import { api } from '../api';

export const categoriesService = {
  list: async () => api.get('/api/categories/'),
  create: async (data: any) => api.post('/api/categories/', data),
  update: async (id: number | string, data: any) => api.put(`/api/categories/${id}/`, data),
  delete: async (id: number | string) => api.delete(`/api/categories/${id}/`),
};
