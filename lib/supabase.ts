import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_type: 'client' | 'professional';
          full_name: string;
          email: string;
          phone?: string;
          avatar_url?: string;
          location?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_type: 'client' | 'professional';
          full_name: string;
          email: string;
          phone?: string;
          avatar_url?: string;
          location?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_type?: 'client' | 'professional';
          full_name?: string;
          email?: string;
          phone?: string;
          avatar_url?: string;
          location?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          professional_id: string;
          title: string;
          description: string;
          price_from: number;
          price_to?: number;
          duration_hours: number;
          max_guests: number;
          location: string;
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          title: string;
          description: string;
          price_from: number;
          price_to?: number;
          duration_hours: number;
          max_guests: number;
          location: string;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          title?: string;
          description?: string;
          price_from?: number;
          price_to?: number;
          duration_hours?: number;
          max_guests?: number;
          location?: string;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          client_id: string;
          professional_id: string;
          service_id: string;
          event_date: string;
          event_time: string;
          guests_count: number;
          location: string;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          total_price: number;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          professional_id: string;
          service_id: string;
          event_date: string;
          event_time: string;
          guests_count: number;
          location: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          total_price: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          professional_id?: string;
          service_id?: string;
          event_date?: string;
          event_time?: string;
          guests_count?: number;
          location?: string;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          total_price?: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      professional_photos: {
        Row: {
          id: string;
          professional_id: string;
          photo_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          photo_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          professional_id?: string;
          photo_url?: string;
          created_at?: string;
        };
      };
    };
  };
};