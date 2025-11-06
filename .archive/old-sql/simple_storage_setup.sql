-- Minimal Storage Setup (run in Supabase SQL Editor)
-- This should work without table ownership issues

-- Create bucket only (no policy changes)
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('photos', 'photos', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Check if bucket was created
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'photos';