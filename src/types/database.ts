// =====================================================
// Database Types for SnapWorxx
// =====================================================
// TypeScript types that match the Supabase schema
// =====================================================

export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface Event {
  id: string;
  name: string;
  slug: string;
  email: string;
  stripe_session_id: string | null;
  stripe_payment_status: PaymentStatus;
  is_active: boolean;
  created_at: string;
  expires_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  event_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string;
  uploaded_at: string;
  uploader_ip: string | null;
}

export interface EventStats {
  photo_count: number;
  total_size: number;
  days_remaining: number;
}

// Insert types (for creating new records)
export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PhotoInsert = Omit<Photo, 'id' | 'uploaded_at'> & {
  id?: string;
  uploaded_at?: string;
};

// Update types (for updating existing records)
export type EventUpdate = Partial<Omit<Event, 'id' | 'created_at'>>;
export type PhotoUpdate = Partial<Omit<Photo, 'id' | 'event_id' | 'uploaded_at'>>;

// Database response types
export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: EventInsert;
        Update: EventUpdate;
      };
      photos: {
        Row: Photo;
        Insert: PhotoInsert;
        Update: PhotoUpdate;
      };
    };
    Functions: {
      deactivate_expired_events: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_event_stats: {
        Args: { event_uuid: string };
        Returns: EventStats[];
      };
    };
  };
}
