export type PeerTransferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface PeerTransfer {
  id: string;
  sender: number;
  sender_username: string;
  sender_name: string;
  sender_account: string;
  sender_account_name: string;
  sender_account_color?: string;
  sender_account_icon?: string;
  receiver: number;
  receiver_username: string;
  receiver_name: string;
  receiver_account?: string | null;
  receiver_account_name?: string | null;
  amount: number;
  description: string;
  status: PeerTransferStatus;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface SendPeerTransferData {
  sender_account: string;
  receiver_id: number;
  amount: number;
  description?: string;
  date?: string;
}
