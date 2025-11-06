-- Migration to add email field to existing events table
-- Run this if you already have an events table without the email field

-- Add email column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='events' AND column_name='email') THEN
        ALTER TABLE events ADD COLUMN email text NOT NULL DEFAULT 'guest@example.com';
    END IF;
END $$;

-- Verify the schema
\d events;

-- Show sample data
SELECT id, name, slug, email, status, created_at FROM events LIMIT 5;