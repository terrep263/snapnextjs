-- Create Sample Event for Gallery Testing
-- Run this in Supabase SQL Editor to create the sample event

-- Create sample event with slug 'sample-event-slug'
INSERT INTO events (
  id, 
  name, 
  slug, 
  status, 
  created_at, 
  updated_at,
  is_freebie,
  is_free,
  watermark_enabled,
  max_storage_bytes,
  max_photos
) 
VALUES (
  'sample-event-id',
  'Sample Event Gallery', 
  'sample-event-slug',
  'active',
  now(),
  now(),
  false,
  false,
  false,
  10737418240, -- 10GB
  1000
) 
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  updated_at = now();

-- Insert sample photos for the gallery
-- Using placeholder images from picsum.photos for testing
INSERT INTO photos (
  id,
  event_id, 
  filename, 
  url, 
  storage_url,
  file_path,
  size, 
  type,
  mime_type,
  width,
  height,
  is_video,
  is_approved,
  thumbnail_url,
  created_at, 
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'sample-event-id',
  'sample-photo-1.jpg',
  'https://picsum.photos/1200/800?random=1',
  'https://picsum.photos/1200/800?random=1',
  'sample-event-id/sample-photo-1.jpg',
  854000,
  'image/jpeg',
  'image/jpeg',
  1200,
  800,
  false,
  true,
  'https://picsum.photos/400/400?random=1',
  now() - INTERVAL '2 hours',
  now() - INTERVAL '2 hours'
),
(
  gen_random_uuid(),
  'sample-event-id',
  'sample-photo-2.jpg',
  'https://picsum.photos/800/1200?random=2',
  'https://picsum.photos/800/1200?random=2',
  'sample-event-id/sample-photo-2.jpg',
  675000,
  'image/jpeg',
  'image/jpeg',
  800,
  1200,
  false,
  true,
  'https://picsum.photos/400/400?random=2',
  now() - INTERVAL '1 hour',
  now() - INTERVAL '1 hour'
),
(
  gen_random_uuid(),
  'sample-event-id',
  'sample-photo-3.jpg',
  'https://picsum.photos/1600/900?random=3',
  'https://picsum.photos/1600/900?random=3',
  'sample-event-id/sample-photo-3.jpg',
  960000,
  'image/jpeg',
  'image/jpeg',
  1600,
  900,
  false,
  true,
  'https://picsum.photos/400/400?random=3',
  now() - INTERVAL '30 minutes',
  now() - INTERVAL '30 minutes'
),
(
  gen_random_uuid(),
  'sample-event-id',
  'sample-photo-4.jpg',
  'https://picsum.photos/600/600?random=4',
  'https://picsum.photos/600/600?random=4',
  'sample-event-id/sample-photo-4.jpg',
  512000,
  'image/jpeg',
  'image/jpeg',
  600,
  600,
  false,
  true,
  'https://picsum.photos/400/400?random=4',
  now() - INTERVAL '15 minutes',
  now() - INTERVAL '15 minutes'
),
(
  gen_random_uuid(),
  'sample-event-id',
  'sample-photo-5.jpg',
  'https://picsum.photos/1000/1500?random=5',
  'https://picsum.photos/1000/1500?random=5',
  'sample-event-id/sample-photo-5.jpg',
  720000,
  'image/jpeg',
  'image/jpeg',
  1000,
  1500,
  false,
  true,
  'https://picsum.photos/400/400?random=5',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the sample event was created
SELECT 
  'Sample Event' as status,
  id,
  name,
  slug,
  status as event_status,
  created_at
FROM events 
WHERE slug = 'sample-event-slug';

-- Verify photos were inserted
SELECT 
  'Sample Photos' as status,
  COUNT(*) as photo_count,
  COUNT(*) FILTER (WHERE is_video = true) as video_count,
  COUNT(*) FILTER (WHERE is_approved = true) as approved_count
FROM photos 
WHERE event_id = 'sample-event-id';

-- Show sample photos
SELECT 
  filename,
  width || 'x' || height as dimensions,
  is_video,
  is_approved,
  created_at
FROM photos 
WHERE event_id = 'sample-event-id'
ORDER BY created_at DESC;

