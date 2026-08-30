import { api } from './api';
import type { User } from '../types/auth';

export const usersService = {
  list: async (): Promise<User[]> => api.get('/api/users/'),
};
