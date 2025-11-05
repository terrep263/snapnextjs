-- Update Storage Bucket to Support 5GB Files
-- This migration increases the 'photos' bucket limit from 100MB to 5GB
-- Required for uploading large video files (307.7MB+)

-- Update the photos bucket with 5GB limit
UPDATE storage.buckets
SET 
  file_size_limit = 5368709120, -- 5GB in bytes
  allowed_mime_types = ARRAY[
    'image/jpeg','image/jpg','image/png','image/gif','image/webp',
    'video/mp4','video/mov','video/avi','video/quicktime','video/x-msvideo',
    'audio/mpeg','audio/wav','audio/ogg','audio/aac'
  ]::text[]
WHERE id = 'photos';

-- Verify the update
SELECT id, name, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'photos';
