import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// `supabase` is null when the env vars aren't set yet (e.g. first run before
// the project owner has created a Supabase project). Every call site should
// handle that and fall back gracefully instead of crashing the page.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type WeddingSettings = {
  id: number;
  couple_name_a: string;
  couple_name_b: string;
  wedding_date: string;
  eyebrow_tagline: string;
  venue_name: string;
  venue_address: string;
  venue_maps_query: string;
  ceremony_time: string;
  reception_time: string;
  updated_at: string;
};

export type RsvpRow = {
  id: string;
  name: string;
  attending: 'yes' | 'no';
  guests: number;
  message: string | null;
  created_at: string;
};

export const DEFAULT_SETTINGS: WeddingSettings = {
  id: 1,
  couple_name_a: 'Amy',
  couple_name_b: 'David',
  wedding_date: '2026-10-24T16:00:00+07:00',
  eyebrow_tagline: 'A day to remember. A love to keep.',
  venue_name: 'The Glass House',
  venue_address: 'Garden Estate',
  venue_maps_query: 'The Glass House Garden Estate',
  ceremony_time: '04:00 PM',
  reception_time: '06:30 PM',
  updated_at: new Date().toISOString(),
};
