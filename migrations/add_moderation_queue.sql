-- Moderation Queue Table
-- Optional table for tracking flagged content pending review
-- The moderation system works without this table, but it provides better organization

CREATE TABLE IF NOT EXISTS moderation_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  event_id text NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  flagged_by text,
  flag_reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by text,
  reviewed_at timestamptz,
  resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_photo_id ON moderation_queue(photo_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_event_id ON moderation_queue(event_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at ON moderation_queue(created_at DESC);

-- Enable RLS
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Permissive policies (adjust for production)
CREATE POLICY "Allow all operations on moderation_queue" ON moderation_queue 
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Note: The moderation system will work without this table.
-- If the table doesn't exist, the system falls back to querying photos directly.

