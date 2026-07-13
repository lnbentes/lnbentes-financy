import { api } from './api';

export const authService = {
  login: async (username?: string, password?: string) => {
    return api.post('/api/auth/login/', { username, password });
  },
  logout: async () => {
    return api.post('/api/auth/logout/');
  },
};
