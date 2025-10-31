-- Fix Premium Gallery Schema - Add Missing Fields for Full Functionality
-- Run this in Supabase SQL Editor to enable all premium gallery features

-- Add missing columns to photos table for premium gallery
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS thumbnail_path text,
ADD COLUMN IF NOT EXISTS is_video boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS duration integer,
ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS width integer,
ADD COLUMN IF NOT EXISTS height integer;

-- Insert test event for validation
INSERT INTO events (id, name, slug, status, created_at, updated_at)
VALUES (
  'test',
  'Test Event Gallery', 
  'test',
  'active',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();

-- Insert sample photos for testing
INSERT INTO photos (
  id,
  event_id, 
  filename, 
  url, 
  file_path,
  title,
  description,
  size, 
  type,
  width,
  height,
  likes,
  is_favorite,
  created_at, 
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'test',
  'sample-landscape.jpg',
  'https://picsum.photos/1200/800?random=1',
  'test/sample-landscape.jpg',
  'Beautiful Landscape',
  'A stunning mountain landscape with clear blue skies',
  854000,
  'image/jpeg',
  1200,
  800,
  5,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'test',
  'sample-portrait.jpg', 
  'https://picsum.photos/600/900?random=2',
  'test/sample-portrait.jpg',
  'Urban Portrait',
  'Modern architectural photography in the city',
  675000,
  'image/jpeg',
  600,
  900,
  3,
  false,
  now(),
  now()
),
(
  gen_random_uuid(),
  'test',
  'sample-square.jpg',
  'https://picsum.photos/800/800?random=3', 
  'test/sample-square.jpg',
  'Abstract Art',
  'Creative abstract composition with vibrant colors',
  512000,
  'image/jpeg',
  800,
  800,
  7,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'test',
  'sample-wide.jpg',
  'https://picsum.photos/1600/600?random=4',
  'test/sample-wide.jpg',
  'Panoramic View',
  'Wide panoramic shot of the coastline at sunset',
  960000,
  'image/jpeg',
  1600,
  600,
  12,
  false,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted correctly
SELECT 
  'Photos inserted:' as status,
  count(*) as count 
FROM photos 
WHERE event_id = 'test';

SELECT 
  'Events created:' as status,
  count(*) as count  
FROM events 
WHERE id = 'test';

-- Show sample data
SELECT 
  filename,
  title,
  width || 'x' || height as dimensions,
  likes,
  is_favorite,
  substring(url for 50) || '...' as url_preview
FROM photos 
WHERE event_id = 'test'
ORDER BY created_at;