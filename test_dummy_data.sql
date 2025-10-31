-- Test Database with Dummy Content for Diagnostic
-- Run this in Supabase SQL Editor to create test data

-- First, ensure the tables exist
INSERT INTO events (id, name, slug, status) 
VALUES ('test', 'Test Event Gallery', 'test', 'active')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status;

-- Insert dummy photos for testing
INSERT INTO photos (id, event_id, filename, url, file_path, size, type, created_at) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'test', 'dummy-photo-1.jpg', 'https://picsum.photos/800/600?random=1', 'events/test/dummy-photo-1.jpg', 245760, 'image/jpeg', NOW() - INTERVAL '2 hours'),
  ('550e8400-e29b-41d4-a716-446655440002', 'test', 'dummy-photo-2.jpg', 'https://picsum.photos/600/800?random=2', 'events/test/dummy-photo-2.jpg', 183456, 'image/jpeg', NOW() - INTERVAL '1 hour'),
  ('550e8400-e29b-41d4-a716-446655440003', 'test', 'dummy-photo-3.jpg', 'https://picsum.photos/900/600?random=3', 'events/test/dummy-photo-3.jpg', 298765, 'image/jpeg', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO UPDATE SET 
  filename = EXCLUDED.filename,
  url = EXCLUDED.url,
  file_path = EXCLUDED.file_path,
  size = EXCLUDED.size,
  type = EXCLUDED.type;

-- Check if data was inserted correctly
SELECT 'Events' as table_name, COUNT(*) as count FROM events WHERE id = 'test'
UNION ALL
SELECT 'Photos' as table_name, COUNT(*) as count FROM photos WHERE event_id = 'test';

-- Verify the data structure
SELECT 
  e.id as event_id,
  e.name as event_name,
  e.slug as event_slug,
  COUNT(p.id) as photo_count,
  MIN(p.created_at) as oldest_photo,
  MAX(p.created_at) as newest_photo
FROM events e
LEFT JOIN photos p ON e.id = p.event_id
WHERE e.id = 'test'
GROUP BY e.id, e.name, e.slug;