-- Add cover_photo_url column for social media sharing
-- This allows event creators to choose a specific landscape image for link previews

-- Add the cover_photo_url column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;

-- Add a comment explaining the column's purpose
COMMENT ON COLUMN events.cover_photo_url IS 'URL of the cover photo used for social media link previews (OG image). Should be a landscape image for best results.';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'cover_photo_url';
