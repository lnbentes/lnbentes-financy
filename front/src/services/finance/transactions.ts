import { api } from '../api';
import type { 
  Transaction, 
  MonthlySummary, 
  TransactionFilters, 
  DataExportFilters, 
  DataImportResult 
} from '../../types/finance';

export const transactionsService = {
  list: async (params: TransactionFilters = {}): Promise<Transaction[]> => {
    return api.get('/api/transactions/', { params });
  },
  create: async (data: Partial<Transaction> & { installments?: number }): Promise<Transaction[]> => {
    return api.post('/api/transactions/', data);
  },
  update: async (id: string, data: Partial<Transaction>, updateAll = false): Promise<Transaction> => {
    return api.put(`/api/transactions/${id}/`, data, { params: { update_all: updateAll } });
  },
  patch: async (id: string, data: Partial<Transaction>, updateAll = false): Promise<Transaction> => {
    return api.patch(`/api/transactions/${id}/`, data, { params: { update_all: updateAll } });
  },
  delete: async (id: string, deleteAll = false): Promise<void> => {
    return api.delete(`/api/transactions/${id}/`, { params: { delete_all: deleteAll } });
  },
  summary: async (params: { year?: number; month?: number } = {}): Promise<MonthlySummary> => {
    return api.get('/api/transactions/summary/', { params });
  },
  export: (params: DataExportFilters = {}): string => {
    const entries = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '');
    const searchParams = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
    const query = searchParams.toString();
    return `/api/transactions/export/${query ? '?' + query : ''}`;
  },
  import: async (formData: FormData): Promise<DataImportResult> => {
    return api.post('/api/transactions/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importJson: async (payload: unknown): Promise<DataImportResult> => {
    return api.post('/api/transactions/import/', payload);
  },
  bulkDelete: async (data: { account_ids?: string[]; year?: number; month?: number }): Promise<{ deleted: number }> => {
    return api.delete('/api/transactions/bulk-delete/', { data });
  },
};
