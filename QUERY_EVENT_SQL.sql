-- ============================================================
-- SQL Queries to Find All Information About Event
-- Event: steve-s-2025-birthday-qwf1e2
-- URL: https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2
-- ============================================================
-- Run these queries in your Supabase SQL Editor
-- ============================================================

-- 1. Get Event Details
SELECT * FROM events
WHERE slug = 'steve-s-2025-birthday-qwf1e2';

-- 2. Get All Photos for This Event
-- First, get the event_id from query #1, then use it here:
SELECT
  id,
  filename,
  url,
  file_path,
  size,
  type,
  created_at,
  updated_at
FROM photos
WHERE event_id = (
  SELECT id FROM events WHERE slug = 'steve-s-2025-birthday-qwf1e2'
)
ORDER BY created_at ASC;

-- 3. Get Photo Count
SELECT
  COUNT(*) as total_photos,
  SUM(size) as total_size_bytes,
  ROUND(SUM(size)/1024.0/1024.0, 2) as total_size_mb
FROM photos
WHERE event_id = (
  SELECT id FROM events WHERE slug = 'steve-s-2025-birthday-qwf1e2'
);

-- 4. Get Event with Photo Count (Combined)
SELECT
  e.*,
  COUNT(p.id) as photo_count,
  ROUND(SUM(p.size)/1024.0/1024.0, 2) as total_size_mb
FROM events e
LEFT JOIN photos p ON p.event_id = e.id
WHERE e.slug = 'steve-s-2025-birthday-qwf1e2'
GROUP BY e.id;

-- 5. Get Photo Types Breakdown
SELECT
  type,
  COUNT(*) as count,
  ROUND(SUM(size)/1024.0/1024.0, 2) as total_mb
FROM photos
WHERE event_id = (
  SELECT id FROM events WHERE slug = 'steve-s-2025-birthday-qwf1e2'
)
GROUP BY type
ORDER BY count DESC;

-- 6. Get First and Last Photo Upload Times
SELECT
  MIN(created_at) as first_photo_upload,
  MAX(created_at) as last_photo_upload,
  MAX(created_at) - MIN(created_at) as upload_duration
FROM photos
WHERE event_id = (
  SELECT id FROM events WHERE slug = 'steve-s-2025-birthday-qwf1e2'
);

-- 7. Check if Event Exists (Simple Check)
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM events WHERE slug = 'steve-s-2025-birthday-qwf1e2')
    THEN 'Event exists in database'
    ELSE 'Event NOT found in database'
  END as status;

-- ============================================================
-- Alternative: Search by Partial Slug Match
-- ============================================================
-- If exact slug doesn't work, try searching for similar slugs:
SELECT id, name, slug, created_at, status
FROM events
WHERE slug LIKE '%steve%'
   OR slug LIKE '%birthday%'
   OR slug LIKE '%qwf1e2%'
ORDER BY created_at DESC;

-- ============================================================
-- Find All Events (if you want to see all available events)
-- ============================================================
SELECT
  id,
  name,
  slug,
  email,
  status,
  plan_type,
  created_at,
  (SELECT COUNT(*) FROM photos WHERE event_id = events.id) as photo_count
FROM events
ORDER BY created_at DESC
LIMIT 20;
