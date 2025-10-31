-- SnapWorxx Complete Database & RLS Policy Setup
-- Run this in your Supabase SQL Editor

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all operations on events" ON events;
DROP POLICY IF EXISTS "Allow all operations on photos" ON photos;

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  email text NOT NULL DEFAULT 'guest@example.com',
  stripe_session_id text UNIQUE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  filename text NOT NULL,
  url text NOT NULL,
  file_path text NOT NULL,
  size bigint,
  type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for events table
CREATE POLICY "events_select_policy" ON events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events_insert_policy" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "events_update_policy" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "events_delete_policy" ON events FOR DELETE TO anon, authenticated USING (true);

-- Create permissive policies for photos table  
CREATE POLICY "photos_select_policy" ON photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "photos_insert_policy" ON photos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "photos_update_policy" ON photos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "photos_delete_policy" ON photos FOR DELETE TO anon, authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_stripe_session ON events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);

-- Verify tables exist
SELECT 'Events table' as table_name, count(*) as row_count FROM events
UNION ALL
SELECT 'Photos table' as table_name, count(*) as row_count FROM photos;

-- Show all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('events', 'photos')
ORDER BY tablename, policyname;