import { api } from './api';

export interface RegistrationRequestData {
  username: string;
  email: string;
  first_name: string;
  last_name?: string;
  password?: string;
}

export const registrationService = {
  createRequest: async (data: RegistrationRequestData) => {
    return api.post('/api/registration-requests/', data);
  },
  listRequests: async () => {
    return api.get('/api/registration-requests/');
  },
  approveRequest: async (id: number) => {
    return api.post(`/api/registration-requests/${id}/approve/`);
  },
  rejectRequest: async (id: number) => {
    return api.post(`/api/registration-requests/${id}/reject/`);
  },
};
