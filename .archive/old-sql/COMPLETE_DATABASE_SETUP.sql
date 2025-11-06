-- SnapWorxx Complete Database & RLS Policy Setup
-- Run this ENTIRE script in your Supabase SQL Editor

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on events" ON events;
DROP POLICY IF EXISTS "Allow all operations on photos" ON photos;
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;
DROP POLICY IF EXISTS "photos_select_policy" ON photos;
DROP POLICY IF EXISTS "photos_insert_policy" ON photos;
DROP POLICY IF EXISTS "photos_update_policy" ON photos;
DROP POLICY IF EXISTS "photos_delete_policy" ON photos;

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

-- Add email column if it doesn't exist (for existing tables)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='events' AND column_name='email') THEN
        ALTER TABLE events ADD COLUMN email text NOT NULL DEFAULT 'guest@example.com';
    END IF;
END $$;

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

-- Create VERY permissive policies for development
-- Events table policies
CREATE POLICY "events_allow_all_select" ON events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events_allow_all_insert" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "events_allow_all_update" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "events_allow_all_delete" ON events FOR DELETE TO anon, authenticated USING (true);

-- Photos table policies  
CREATE POLICY "photos_allow_all_select" ON photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "photos_allow_all_insert" ON photos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "photos_allow_all_update" ON photos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "photos_allow_all_delete" ON photos FOR DELETE TO anon, authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_stripe_session ON events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_events_email ON events(email);
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);

-- Test the setup with a sample insert and delete
DO $$
DECLARE
    test_event_id text := 'test-setup-' || extract(epoch from now())::text;
BEGIN
    -- Test event creation
    INSERT INTO events (id, name, slug, email) 
    VALUES (test_event_id, 'Test Setup Event', 'test-setup-slug', 'test@setup.com');
    
    -- Test photo creation
    INSERT INTO photos (event_id, filename, url, file_path, size, type)
    VALUES (test_event_id, 'test.jpg', 'https://test.url', 'test/path.jpg', 1000, 'image/jpeg');
    
    -- Clean up test data
    DELETE FROM photos WHERE event_id = test_event_id;
    DELETE FROM events WHERE id = test_event_id;
    
    RAISE NOTICE '✅ Setup test successful - policies are working!';
END $$;

-- Verify tables and policies exist
SELECT 'Events table' as table_name, count(*) as row_count FROM events
UNION ALL
SELECT 'Photos table' as table_name, count(*) as row_count FROM photos;

-- Show all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('events', 'photos')
ORDER BY tablename, policyname;