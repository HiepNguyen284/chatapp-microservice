export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

export interface BannedWord {
  id: number;
  word: string;
  created_at: string;
}
