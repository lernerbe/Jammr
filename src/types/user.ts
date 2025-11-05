import { GeoPoint } from 'firebase/firestore';

export interface LocationData {
  location: string;
  coords: {
    lat: number;
    lng: number;
  };
  place_id: string;
}

export interface UserProfile {
  user_id: string;
  name: string;
  instrument: string;
  genres: string[];
  skill_level: 'Beginner' | 'Intermediate' | 'Advanced';
  bio: string;
  location: LocationData | GeoPoint; // Support both old and new formats
  audio_clips: string[];
  image_url?: string; // Optional field
  image_gallery?: string[]; // Optional list of gallery image URLs
  video_clips?: string[]; // Optional list of uploaded video URLs
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
