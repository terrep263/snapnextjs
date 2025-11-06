-- ============================================
-- VIDEO THUMBNAIL SUPPORT MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- Add thumbnail_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'photos'
    AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE public.photos ADD COLUMN thumbnail_url text;
    RAISE NOTICE '✅ Added thumbnail_url column';
  ELSE
    RAISE NOTICE '⚠️  thumbnail_url column already exists';
  END IF;
END $$;

-- Add duration column if it doesn't exist (for video length in seconds)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'photos'
    AND column_name = 'duration'
  ) THEN
    ALTER TABLE public.photos ADD COLUMN duration integer;
    RAISE NOTICE '✅ Added duration column';
  ELSE
    RAISE NOTICE '⚠️  duration column already exists';
  END IF;
END $$;

-- Verify the changes
SELECT 'Columns verified' as status, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'photos'
AND column_name IN ('thumbnail_url', 'duration', 'is_video');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ VIDEO THUMBNAIL MIGRATION COMPLETE!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ Added: thumbnail_url (text)';
  RAISE NOTICE '✅ Added: duration (integer - seconds)';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ Video thumbnails will now display properly';
  RAISE NOTICE '✅ ============================================';
END $$;
