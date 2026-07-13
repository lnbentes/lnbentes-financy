import { api } from './api';

export const usersService = {
  list: async () => api.get('/api/users/'),
};
