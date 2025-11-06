-- Add header_image and profile_image columns to events table
-- Run this in your Supabase SQL Editor

-- Add header_image column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'header_image') THEN
        ALTER TABLE events ADD COLUMN header_image text;
    END IF;
END $$;

-- Add profile_image column if it doesn't exist  
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'profile_image') THEN
        ALTER TABLE events ADD COLUMN profile_image text;
    END IF;
END $$;