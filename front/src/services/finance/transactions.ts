import { api } from '../api';

export const transactionsService = {
  list: async (params = {}) => {
    return api.get('/api/transactions/', { params });
  },
  create: async (data: any) => {
    return api.post('/api/transactions/', data);
  },
  update: async (id: number | string, data: any) => {
    return api.put(`/api/transactions/${id}/`, data);
  },
  patch: async (id: number | string, data: any) => {
    return api.patch(`/api/transactions/${id}/`, data);
  },
  delete: async (id: number | string) => {
    return api.delete(`/api/transactions/${id}/`);
  },
  summary: async (params = {}) => {
    return api.get('/api/transactions/summary/', { params });
  },
  export: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
      ) as any
    ).toString();
    return `/api/transactions/export/${query ? '?' + query : ''}`;
  },
  import: async (formData: FormData) => {
    return api.post('/api/transactions/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importJson: async (payload: any) => {
    return api.post('/api/transactions/import/', payload);
  },
  bulkDelete: async (data: any) => {
    return api.delete('/api/transactions/bulk-delete/', { data });
  },
};
