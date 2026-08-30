import { api } from './api';
import type { PeerTransfer, SendPeerTransferData } from '../types/peerTransfer';
import type { User } from '../types/auth';

export const peerTransferService = {
  list: async (): Promise<PeerTransfer[]> => {
    return api.get('/api/peer-transfers/');
  },
  recipients: async (search = ''): Promise<User[]> => {
    return api.get('/api/peer-transfers/recipients/', { params: { search } });
  },
  send: async (data: SendPeerTransferData): Promise<PeerTransfer> => {
    return api.post('/api/peer-transfers/', data);
  },
  accept: async (id: string, receiver_account: string): Promise<PeerTransfer> => {
    return api.post(`/api/peer-transfers/${id}/accept/`, { receiver_account });
  },
  reject: async (id: string): Promise<PeerTransfer> => {
    return api.post(`/api/peer-transfers/${id}/reject/`);
  },
  cancel: async (id: string): Promise<PeerTransfer> => {
    return api.post(`/api/peer-transfers/${id}/cancel/`);
  },
};
