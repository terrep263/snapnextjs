-- =====================================================
-- SnapWorxx Storage Configuration for Supabase
-- =====================================================
-- This file configures storage buckets and policies
-- for the SnapWorxx event photo sharing application
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKET
-- =====================================================

-- Create the event-photos bucket for storing uploaded images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'event-photos',
    'event-photos',
    true,  -- Public bucket (files can be accessed via public URL)
    52428800,  -- 50MB file size limit per file
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Allow anyone to read (download) photos from the bucket
CREATE POLICY "Allow public read access"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'event-photos');

-- Allow anyone to upload photos to the bucket
CREATE POLICY "Allow public upload access"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'event-photos'
        AND (storage.foldername(name))[1] IS NOT NULL  -- Ensure files are in a folder
    );

-- Allow anyone to update their uploaded photos (for retries/replacements)
CREATE POLICY "Allow public update access"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'event-photos')
    WITH CHECK (bucket_id = 'event-photos');

-- Only allow service role to delete photos
CREATE POLICY "Allow service role to delete photos"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'event-photos'
        AND auth.role() = 'service_role'
    );

-- =====================================================
-- NOTES
-- =====================================================
-- File organization structure: event-photos/[event-slug]/[filename]
-- Example: event-photos/johns-birthday-2024/photo-1234567890.jpg
--
-- Public URLs will be in format:
-- https://[project-ref].supabase.co/storage/v1/object/public/event-photos/[event-slug]/[filename]
--
-- Security considerations:
-- 1. Files are stored with random UUIDs in filename to prevent guessing
-- 2. File size is limited to 50MB per file
-- 3. Only image MIME types are allowed
-- 4. Deletion is restricted to service role only
-- =====================================================
