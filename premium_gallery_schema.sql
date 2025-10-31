-- SnapWorxx Premium Gallery Schema Updates
-- Run these commands in your Supabase SQL Editor to add premium gallery features

-- Add new columns to photos table for premium features
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

-- Create favorites table for tracking user favorites (if you want user-specific favorites)
CREATE TABLE IF NOT EXISTS photo_favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id text, -- Can be session ID or actual user ID
  created_at timestamptz DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Create likes table for tracking photo likes
CREATE TABLE IF NOT EXISTS photo_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id text, -- Can be session ID or IP address
  created_at timestamptz DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_is_favorite ON photos(is_favorite);
CREATE INDEX IF NOT EXISTS idx_photos_likes ON photos(likes);
CREATE INDEX IF NOT EXISTS idx_photos_is_video ON photos(is_video);
CREATE INDEX IF NOT EXISTS idx_photo_favorites_photo_id ON photo_favorites(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_favorites_user_id ON photo_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo_id ON photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_user_id ON photo_likes(user_id);

-- Enable RLS on new tables
ALTER TABLE photo_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Allow all operations on photo_favorites" ON photo_favorites FOR ALL TO anon USING (true);
CREATE POLICY "Allow all operations on photo_likes" ON photo_likes FOR ALL TO anon USING (true);

-- Function to update photo likes count
CREATE OR REPLACE FUNCTION update_photo_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE photos 
    SET likes = likes + 1 
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE photos 
    SET likes = GREATEST(likes - 1, 0) 
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update likes count
CREATE TRIGGER trigger_update_photo_likes_count
  AFTER INSERT OR DELETE ON photo_likes
  FOR EACH ROW EXECUTE FUNCTION update_photo_likes_count();

-- Add thumbnail generation function (placeholder - you'd implement actual thumbnail generation)
CREATE OR REPLACE FUNCTION generate_thumbnail_url(original_url text)
RETURNS text AS $$
BEGIN
  -- For now, return the original URL
  -- In production, you'd implement actual thumbnail generation
  RETURN original_url;
END;
$$ LANGUAGE plpgsql;

-- Update existing photos to set default values
UPDATE photos 
SET 
  likes = 0,
  is_favorite = false,
  is_video = CASE 
    WHEN filename ILIKE '%.mp4' OR filename ILIKE '%.mov' OR filename ILIKE '%.avi' OR filename ILIKE '%.webm' 
    THEN true 
    ELSE false 
  END,
  thumbnail_url = url
WHERE likes IS NULL OR is_favorite IS NULL OR is_video IS NULL;

-- Verification queries
SELECT 
  'photos' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'photos' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'photo_favorites' as table_name,
  count(*) as row_count
FROM photo_favorites;

SELECT 
  'photo_likes' as table_name,
  count(*) as row_count
FROM photo_likes;