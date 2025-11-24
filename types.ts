
export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  USER = 'USER'
}

export enum Condition {
  NEW = 'New',
  LIKE_NEW = 'Like New',
  USED = 'Used',
  DEFECTIVE = 'For Parts'
}

export interface Location {
  region: string;
  province: string;
  city: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  location: Location;
  isVerified: boolean;
  avatar?: string;
  joined_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_verified: boolean;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: Condition;
  images: string[]; // Base64 strings
  location: Location;
  status: 'active' | 'sold' | 'pending' | 'rejected';
  views: number;
  likes: number;
  created_at: string;
}

export interface Message {
  id: string;
  from_user: string;
  to_user: string;
  listing_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface ChatThread {
  id: string;
  listing: Listing;
  messages: Message[];
  otherUser: { id: string; name: string; avatar?: string };
  lastMessage: Message;
  unreadCount: number;
}

// Analytics Types
export interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalVolume: number; // currency
  pendingApprovals: number;
  listingsByRegion: { region: string; count: number }[];
  listingsByCategory: { category: string; count: number }[];
  dailyViews: { date: string; count: number }[];
}

export interface LandingStat {
    label: string;
    value: number;
}

export interface SiteReview {
    id: string;
    user_name: string;
    user_location: string;
    rating: number;
    comment: string;
    created_at: string;
}
