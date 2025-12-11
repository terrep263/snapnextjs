-- Setup Sample Event as Freebie for Development Testing
-- This ensures the sample gallery functions exactly like a freebie event
-- so you can see the minimum features users get

-- Update or create sample event with freebie settings
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
  'sample-event-id',
  'Sample Event for Development',
  'sample-event-slug',
  'active',
  true,  -- Mark as freebie (enables dlwatermark.png on downloads)
  true,  -- Also mark as free
  'freebie',  -- Payment type for freebie
  999999999,  -- Unlimited storage (999GB+)
  999999,  -- Unlimited photos
  false,  -- No premium features (no live feed)
  NULL,  -- No password protection
  false,  -- Watermark always enabled for freebie (not a toggle)
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

-- Also update by slug in case ID is different
UPDATE events
SET 
  is_freebie = true,
  is_free = true,
  payment_type = 'freebie',
  max_storage_bytes = 999999999,
  max_photos = 999999,
  feed_enabled = false,
  password_hash = NULL,
  watermark_enabled = false,
  updated_at = NOW()
WHERE slug = 'sample-event-slug';

-- Verify the update
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
  status
FROM events
WHERE slug = 'sample-event-slug' OR id = 'sample-event-id';

