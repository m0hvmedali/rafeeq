
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials as requested
const supabaseUrl = 'https://pawwqdaiucbvohsgmtop.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhd3dxZGFpdWNidm9oc2dtdG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQ5MDgsImV4cCI6MjA3ODc5MDkwOH0.EuNNd8Cj9TBxJvmPARhhR1J1KPwoS3X46msX-MhriRk';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * SQL Schema Reference for Supabase:
 * 
 * -- Table for storing weekly schedules
 * create table schedules (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id text not null, 
 *   data jsonb not null,
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   unique(user_id)
 * );
 * 
 * -- Table for storing daily entries
 * create table daily_entries (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id text not null,
 *   date text not null,
 *   reflection text,
 *   analysis jsonb,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   unique(user_id, date)
 * );
 * 
 * -- NEW: Table for User Stats (Gamification)
 * create table user_stats (
 *   user_id text primary key,
 *   xp integer default 0,
 *   level integer default 1,
 *   streak integer default 0,
 *   last_login_date text,
 *   total_entries integer default 0,
 *   updated_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- NEW: Table for User Preferences & Algorithm Learning
 * create table user_preferences (
 *   user_id text primary key,
 *   theme text default 'dark',
 *   font_size text default 'normal',
 *   reduce_motion boolean default false,
 *   interest_profile jsonb, -- Stores the learned weights { religious: 5, scientific: 2 ... }
 *   updated_at timestamp with time zone default timezone('utc'::text, now())
 * );
 */
