-- SnapWorxx Storage Setup
-- Run this in your Supabase SQL Editor

-- Create the photos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  5368709120, -- 5GB limit (5242880 * 1024 bytes) - supports 4K/HD videos, large file uploads
  ARRAY[
    'image/jpeg','image/jpg','image/png','image/gif','image/webp',
    'video/mp4','video/mov','video/avi','video/quicktime','video/x-msvideo',
    'audio/mpeg','audio/wav','audio/ogg','audio/aac'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS (Row Level Security)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update photos" ON storage.objects;

-- Allow public read access to photos
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'photos');

-- Allow anyone to upload photos (you can restrict this later if needed)
CREATE POLICY "Anyone can upload photos" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'photos');

-- Allow anyone to delete photos (you can restrict this later if needed)
CREATE POLICY "Anyone can delete photos" ON storage.objects 
FOR DELETE USING (bucket_id = 'photos');

-- Allow anyone to update photos (you can restrict this later if needed)
CREATE POLICY "Anyone can update photos" ON storage.objects 
FOR UPDATE USING (bucket_id = 'photos');

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'photos';

-- Show all storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';