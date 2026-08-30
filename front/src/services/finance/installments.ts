import { api } from '../api';
import type { InstallmentGroup } from '../../types/finance';

export const installmentsService = {
  list: async (): Promise<InstallmentGroup[]> => {
    return api.get('/api/transactions/installments/');
  },
  anticipate: async (groupId: string, data: { count?: number; target_date?: string; discount_amount?: number }): Promise<{
    group_id: string;
    anticipated_count: number;
    target_date: string;
    discount_applied: number;
    remaining_count: number;
  }> => {
    return api.post(`/api/transactions/installments/${groupId}/anticipate/`, data);
  },
  payoff: async (groupId: string, data: { target_date?: string; discount_amount?: number }): Promise<{
    group_id: string;
    anticipated_count: number;
    target_date: string;
    discount_applied: number;
    remaining_count: number;
  }> => {
    return api.post(`/api/transactions/installments/${groupId}/payoff/`, data);
  },
};
