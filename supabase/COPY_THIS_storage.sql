-- =====================================================
-- SnapWorxx Storage Bucket - COPY THIS ENTIRE FILE
-- =====================================================
-- Run this in Supabase SQL Editor (New Query)
-- Run AFTER you've run the schema.sql file
-- =====================================================

-- CREATE STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'event-photos',
    'event-photos',
    true,
    52428800,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

-- STORAGE POLICIES
CREATE POLICY "Allow public read access"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'event-photos');

CREATE POLICY "Allow public upload access"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'event-photos'
        AND (storage.foldername(name))[1] IS NOT NULL
    );

CREATE POLICY "Allow public update access"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'event-photos')
    WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "Allow service role to delete photos"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'event-photos'
        AND auth.role() = 'service_role'
    );

-- =====================================================
-- DONE! You should see "Success. 1 row affected"
-- Check: Storage sidebar should show "event-photos" bucket
-- =====================================================
