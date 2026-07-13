import { api } from '../api';

export const accountsService = {
  list: async () => api.get('/api/accounts/'),
  create: async (data: any) => api.post('/api/accounts/', data),
  update: async (id: number | string, data: any) => api.put(`/api/accounts/${id}/`, data),
  delete: async (id: number | string) => api.delete(`/api/accounts/${id}/`),
};
