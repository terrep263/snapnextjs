-- =====================================================
-- COMPLETE UPLOAD FIX FOR SNAPNEXTJS
-- Run this entire script in Supabase SQL Editor
-- =====================================================
-- This fixes the upload error by:
-- 1. Setting up proper RLS policies for storage
-- 2. Creating/updating the photos storage bucket
-- 3. Ensuring database tables have correct policies
-- =====================================================

-- =====================================================
-- PART 1: STORAGE BUCKET SETUP
-- =====================================================

-- Create or update the photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  5368709120, -- 5GB limit
  ARRAY[
    -- Images
    'image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml',
    -- Videos
    'video/mp4','video/quicktime','video/x-msvideo','video/avi','video/x-matroska',
    'video/x-msvideo','video/x-ms-wmv','video/webm','video/x-flv',
    -- Audio
    'audio/mpeg','audio/wav','audio/ogg','audio/aac','audio/flac','audio/x-m4a',
    -- Fallback/Generic
    'application/octet-stream','application/json'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- PART 2: STORAGE RLS POLICIES (THE CRITICAL FIX)
-- =====================================================

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop ALL old storage policies to start fresh
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update photos" ON storage.objects;
DROP POLICY IF EXISTS "photos_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "photos_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "photos_delete_policy" ON storage.objects;

-- Create NEW policies with proper UPDATE clause (CRITICAL FIX)
-- This is what fixes the "row violates row-level security policy" error

CREATE POLICY "photos_select_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "photos_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'photos');

-- THE KEY FIX: Both USING and WITH CHECK for UPDATE operations
-- This allows chunked uploads to work properly
CREATE POLICY "photos_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'photos') WITH CHECK (bucket_id = 'photos');

CREATE POLICY "photos_delete_policy" ON storage.objects
FOR DELETE USING (bucket_id = 'photos');

-- =====================================================
-- PART 3: DATABASE TABLES SETUP
-- =====================================================

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
  is_video boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on database tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 4: DATABASE RLS POLICIES
-- =====================================================

-- Drop existing database policies
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

-- Create permissive policies for events table
CREATE POLICY "events_select_policy" ON events
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "events_insert_policy" ON events
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "events_update_policy" ON events
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "events_delete_policy" ON events
FOR DELETE TO anon, authenticated USING (true);

-- Create permissive policies for photos table
CREATE POLICY "photos_select_policy" ON photos
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "photos_insert_policy" ON photos
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "photos_update_policy" ON photos
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "photos_delete_policy" ON photos
FOR DELETE TO anon, authenticated USING (true);

-- =====================================================
-- PART 5: INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_stripe_session ON events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);

-- =====================================================
-- PART 6: VERIFICATION QUERIES
-- =====================================================

-- Verify storage bucket
SELECT
  id,
  name,
  public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_type_count
FROM storage.buckets
WHERE id = 'photos';

-- Verify storage policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- Verify database tables exist
SELECT
  'Events table' as table_name,
  count(*) as row_count
FROM events
UNION ALL
SELECT
  'Photos table' as table_name,
  count(*) as row_count
FROM photos;

-- Verify database policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('events', 'photos')
ORDER BY tablename, policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ =====================================================';
  RAISE NOTICE '✅ UPLOAD FIX COMPLETE!';
  RAISE NOTICE '✅ =====================================================';
  RAISE NOTICE '✅ 1. Storage bucket configured with 5GB limit';
  RAISE NOTICE '✅ 2. Storage RLS policies updated (WITH CHECK clause)';
  RAISE NOTICE '✅ 3. Database tables created/verified';
  RAISE NOTICE '✅ 4. Database RLS policies applied';
  RAISE NOTICE '✅ 5. Performance indexes created';
  RAISE NOTICE '✅ =====================================================';
  RAISE NOTICE '✅ Your upload system is now ready!';
  RAISE NOTICE '✅ You can now upload photos and videos.';
  RAISE NOTICE '✅ =====================================================';
END $$;
