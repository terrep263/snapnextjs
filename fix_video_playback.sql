-- 🎥 Video Playback Fix - Database Update
-- Run this in Supabase SQL Editor to fix existing video records

-- Step 1: Mark all video files with is_video = true
UPDATE photos 
SET is_video = true 
WHERE (
  filename ILIKE '%.mp4' OR 
  filename ILIKE '%.mov' OR 
  filename ILIKE '%.avi' OR 
  filename ILIKE '%.webm' OR
  filename ILIKE '%.m4v' OR
  filename ILIKE '%.mkv' OR
  type LIKE 'video/%' OR
  url ILIKE '%.mp4' OR 
  url ILIKE '%.mov'
) AND (is_video = false OR is_video IS NULL);

-- Step 2: Set thumbnail_url for videos (browsers can generate from video)
UPDATE photos 
SET thumbnail_url = url
WHERE is_video = true 
AND (thumbnail_url IS NULL OR thumbnail_url = '');

-- Step 3: Verify the fix worked
SELECT 
  'Videos found:' as status,
  count(*) as count
FROM photos 
WHERE is_video = true;

-- Step 4: Show updated video records
SELECT 
  id,
  filename,
  is_video,
  CASE 
    WHEN length(url) > 60 THEN substring(url for 60) || '...'
    ELSE url
  END as url_preview,
  CASE 
    WHEN thumbnail_url = url THEN 'Same as URL'
    WHEN thumbnail_url IS NOT NULL THEN 'Custom thumbnail'
    ELSE 'No thumbnail'
  END as thumbnail_status
FROM photos 
WHERE is_video = true
ORDER BY created_at DESC;

-- Step 5: Check for any remaining unmarked videos
SELECT 
  'Potential unmarked videos:' as warning,
  count(*) as count
FROM photos 
WHERE (
  filename ILIKE '%.mp4' OR 
  filename ILIKE '%.mov' OR 
  filename ILIKE '%.avi' OR 
  filename ILIKE '%.webm' OR
  type LIKE 'video/%'
) AND (is_video = false OR is_video IS NULL);