-- Ensure Sample Event is Configured as Freebie
-- This script ensures the sample-event-slug event functions exactly like a freebie package
-- Run this in your Supabase SQL Editor

-- First, check if the event exists
DO $$
DECLARE
  event_exists BOOLEAN;
  event_id_val TEXT;
BEGIN
  -- Check by slug
  SELECT EXISTS(SELECT 1 FROM events WHERE slug = 'sample-event-slug') INTO event_exists;
  
  IF event_exists THEN
    -- Get the event ID
    SELECT id INTO event_id_val FROM events WHERE slug = 'sample-event-slug' LIMIT 1;
    
    -- Update the event to be a freebie
    UPDATE events
    SET 
      is_freebie = true,
      is_free = true,
      payment_type = 'freebie',
      max_storage_bytes = 999999999,  -- Unlimited storage
      max_photos = 999999,  -- Unlimited photos
      feed_enabled = false,  -- No premium features
      password_hash = NULL,  -- No password protection
      watermark_enabled = false,  -- Watermark always applied for freebie (not a toggle)
      status = 'active',
      updated_at = NOW()
    WHERE slug = 'sample-event-slug' OR id = event_id_val;
    
    RAISE NOTICE '✅ Sample event updated to freebie configuration (ID: %, Slug: sample-event-slug)', event_id_val;
  ELSE
    -- Create the event if it doesn't exist
    INSERT INTO events (
      id,
      name,
      slug,
      status,
      is_freebie,
      is_free,
      payment_type,
      max_storage_bytes,
      max_photos,
      feed_enabled,
      password_hash,
      watermark_enabled,
      created_at,
      updated_at
    )
    VALUES (
      COALESCE((SELECT id FROM events WHERE slug = 'sample-event-slug' LIMIT 1), gen_random_uuid()::text),
      'Sample Event for Development',
      'sample-event-slug',
      'active',
      true,  -- Mark as freebie
      true,  -- Also mark as free
      'freebie',  -- Payment type for freebie
      999999999,  -- Unlimited storage
      999999,  -- Unlimited photos
      false,  -- No premium features
      NULL,  -- No password protection
      false,  -- Watermark always enabled for freebie
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      is_freebie = true,
      is_free = true,
      payment_type = 'freebie',
      max_storage_bytes = 999999999,
      max_photos = 999999,
      feed_enabled = false,
      password_hash = NULL,
      watermark_enabled = false,
      updated_at = NOW();
    
    RAISE NOTICE '✅ Sample event created as freebie';
  END IF;
END $$;

-- Verify the configuration
SELECT 
  id,
  name,
  slug,
  is_freebie,
  is_free,
  payment_type,
  max_storage_bytes,
  max_photos,
  feed_enabled,
  password_hash,
  watermark_enabled,
  status,
  header_image IS NOT NULL as has_header_image,
  profile_image IS NOT NULL as has_profile_image
FROM events
WHERE slug = 'sample-event-slug'
ORDER BY updated_at DESC
LIMIT 1;

