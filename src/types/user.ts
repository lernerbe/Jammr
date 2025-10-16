import { GeoPoint } from 'firebase/firestore';

export interface UserProfile {
  user_id: string;
  name: string;
  instrument: string;
  genres: string[];
  skill_level: 'Beginner' | 'Intermediate' | 'Advanced';
  bio: string;
  location: GeoPoint;
  audio_clips: string[];
  image_url?: string;
  visibility: boolean;
  created_at: Date;
}

export interface MatchRequest {
  match_id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: Date;
}

export interface ChatMessage {
  sender_id: string;
  text: string;
  timestamp: Date;
}

export interface Chat {
  chat_id: string;
  match_id: string;
  messages: ChatMessage[];
}

export interface FilterOptions {
  instrument?: string;
  genres?: string[];
  skillLevel?: string;
  distance?: number;
  searchQuery?: string;
}
