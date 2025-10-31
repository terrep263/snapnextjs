-- SnapWorxx Database Schema
-- Run these SQL commands in your Supabase SQL Editor

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  stripe_session_id text UNIQUE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create photos table  
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_stripe_session ON events(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - you may want to restrict this)
CREATE POLICY "Allow all operations on events" ON events FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations on photos" ON photos FOR ALL TO anon USING (true);

-- =====================================================
-- STORAGE SETUP (Run these commands in Supabase Dashboard)
-- =====================================================

-- 1. Create storage bucket for photos
-- Go to Storage > Create Bucket in Supabase Dashboard
-- Bucket name: photos
-- Public bucket: Yes

-- OR run this SQL in the SQL Editor:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for photos bucket
-- Allow public read access to photos
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'photos');

-- Allow anyone to upload photos
CREATE POLICY "Anyone can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');

-- Allow anyone to delete their own photos (optional)
CREATE POLICY "Anyone can delete photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos');

-- =====================================================
-- SETUP VERIFICATION
-- =====================================================

-- Test that the bucket exists
SELECT * FROM storage.buckets WHERE id = 'photos';

-- Test that policies are created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';