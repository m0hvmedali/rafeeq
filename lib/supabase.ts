import { createClient } from '@supabase/supabase-js';

// These should be set in your environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
// We only initialize if keys are present to prevent crashes
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

/**
 * SQL Schema Reference for Supabase:
 * 
 * -- Table for storing weekly schedules
 * create table schedules (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id text not null, -- Can be a UUID from auth or a generated device ID
 *   data jsonb not null,
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   unique(user_id)
 * );
 * 
 * -- Table for storing daily reflections and analysis
 * create table daily_entries (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id text not null,
 *   date text not null, -- ISO date string YYYY-MM-DD
 *   reflection text,
 *   analysis jsonb,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   unique(user_id, date)
 * );
 */