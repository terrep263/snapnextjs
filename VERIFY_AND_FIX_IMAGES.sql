-- Verify and fix event images columns
-- Run this in your Supabase SQL Editor

-- 1. Check if columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('header_image', 'profile_image')
ORDER BY column_name;

-- 2. If columns don't exist, add them:
DO $$ 
BEGIN
    -- Add header_image column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'header_image') THEN
        ALTER TABLE events ADD COLUMN header_image text;
        RAISE NOTICE 'Added header_image column';
    ELSE
        RAISE NOTICE 'header_image column already exists';
    END IF;

    -- Add profile_image column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'profile_image') THEN
        ALTER TABLE events ADD COLUMN profile_image text;
        RAISE NOTICE 'Added profile_image column';
    ELSE
        RAISE NOTICE 'profile_image column already exists';
    END IF;
END $$;

-- 3. Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('header_image', 'profile_image')
ORDER BY column_name;

-- 4. Check current events and their image status
SELECT 
    id,
    name,
    slug,
    CASE WHEN header_image IS NOT NULL THEN 'Yes' ELSE 'No' END as has_header,
    CASE WHEN profile_image IS NOT NULL THEN 'Yes' ELSE 'No' END as has_profile,
    created_at
FROM events
ORDER BY created_at DESC
LIMIT 10;
