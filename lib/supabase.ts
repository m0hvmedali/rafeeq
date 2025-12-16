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