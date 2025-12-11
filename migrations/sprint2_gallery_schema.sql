-- Sprint 2: Gallery Display & Photo Management
-- Database Schema Enhancements
-- Run this migration in your Supabase SQL Editor

-- =====================================================
-- 1. Photos Table Enhancements
-- =====================================================

-- Add new columns to photos table (using IF NOT EXISTS for safety)
ALTER TABLE photos ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);
ALTER TABLE photos ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE photos ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS storage_url TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS upload_ip VARCHAR(45);
ALTER TABLE photos ADD COLUMN IF NOT EXISTS device_info JSONB;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS exif_data JSONB;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

-- Update uploaded_at to use created_at if null
UPDATE photos SET uploaded_at = created_at WHERE uploaded_at IS NULL;

-- Set default for uploaded_at
ALTER TABLE photos ALTER COLUMN uploaded_at SET DEFAULT NOW();

-- Migrate existing data: copy url to storage_url if storage_url is null
UPDATE photos SET storage_url = url WHERE storage_url IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_approved ON photos(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_photos_filename ON photos(filename);
CREATE INDEX IF NOT EXISTS idx_photos_original_filename ON photos(original_filename);

-- =====================================================
-- 2. Photo Views Table for Analytics
-- =====================================================

CREATE TABLE IF NOT EXISTS photo_views (
    id SERIAL PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    viewer_ip VARCHAR(45),
    viewer_id TEXT,
    viewed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for photo_views
CREATE INDEX IF NOT EXISTS idx_photo_views_photo ON photo_views(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_views_date ON photo_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_photo_views_viewer ON photo_views(viewer_id);

-- =====================================================
-- 3. Photo Tags Table for Search
-- =====================================================

CREATE TABLE IF NOT EXISTS photo_tags (
    id SERIAL PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(photo_id, tag)
);

-- Create indexes for photo_tags
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag ON photo_tags(tag);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_lower ON photo_tags(LOWER(tag));

-- =====================================================
-- 4. Comments for Documentation
-- =====================================================

COMMENT ON TABLE photo_views IS 'Tracks photo views for analytics and engagement metrics';
COMMENT ON TABLE photo_tags IS 'Tags for photo search and categorization';
COMMENT ON COLUMN photos.is_approved IS 'Whether photo has been approved for display';
COMMENT ON COLUMN photos.is_flagged IS 'Whether photo has been flagged for review';
COMMENT ON COLUMN photos.uploaded_at IS 'Timestamp when photo was uploaded';

-- =====================================================
-- 5. Helper Function for Tag Search
-- =====================================================

-- Function to search photos by tags (optional, can be used in queries)
CREATE OR REPLACE FUNCTION search_photos_by_tags(search_term TEXT)
RETURNS TABLE(photo_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT pt.photo_id
    FROM photo_tags pt
    WHERE LOWER(pt.tag) LIKE LOWER('%' || search_term || '%');
END;
$$ LANGUAGE plpgsql;



