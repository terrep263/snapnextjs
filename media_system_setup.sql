-- SnapWorxx Media System - Database Configuration
-- Complete security, logging, and backup infrastructure
-- Run this in your Supabase SQL Editor

-- 1. CREATE AUDIT LOGGING TABLE
CREATE TABLE IF NOT EXISTS media_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id text UNIQUE NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'upload_start', 'upload_complete', 'upload_failed', 'upload_chunk_failed',
    'download_start', 'download_complete', 'download_failed',
    'delete_start', 'delete_complete', 'delete_failed',
    'backup_created', 'backup_verified', 'backup_failed',
    'restore_started', 'restore_completed', 'restore_failed',
    'validation_failed', 'security_alert', 'access_denied'
  )),
  filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  user_agent text,
  ip_address text,
  user_id text,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  error_message text,
  duration_ms integer,
  security_score integer CHECK (security_score >= 0 AND security_score <= 100),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_media_audit_logs_event_id ON media_audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_media_audit_logs_created_at ON media_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_media_audit_logs_event_type ON media_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_media_audit_logs_status ON media_audit_logs(status);

-- 2. CREATE BACKUP METADATA TABLE
CREATE TABLE IF NOT EXISTS media_backup_metadata (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_id text UNIQUE NOT NULL,
  event_id text NOT NULL,
  original_filename text NOT NULL,
  original_path text NOT NULL,
  backup_path text NOT NULL,
  file_hash text NOT NULL,
  file_size bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'verified')),
  verified boolean DEFAULT false,
  retention_days integer DEFAULT 90,
  backup_timestamp timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for backup metadata
CREATE INDEX IF NOT EXISTS idx_media_backup_metadata_event_id ON media_backup_metadata(event_id);
CREATE INDEX IF NOT EXISTS idx_media_backup_metadata_status ON media_backup_metadata(status);
CREATE INDEX IF NOT EXISTS idx_media_backup_metadata_expires_at ON media_backup_metadata(expires_at);

-- 3. CREATE SECURITY EVENTS TABLE
CREATE TABLE IF NOT EXISTS media_security_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,
  filename text NOT NULL,
  issue text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details jsonb,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create indexes for security events
CREATE INDEX IF NOT EXISTS idx_media_security_events_event_id ON media_security_events(event_id);
CREATE INDEX IF NOT EXISTS idx_media_security_events_severity ON media_security_events(severity);
CREATE INDEX IF NOT EXISTS idx_media_security_events_resolved ON media_security_events(resolved);

-- 4. CREATE PERFORMANCE METRICS TABLE
CREATE TABLE IF NOT EXISTS media_performance_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_name text NOT NULL,
  duration_ms integer NOT NULL,
  success boolean NOT NULL,
  event_id text,
  file_size bigint,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_media_performance_metrics_operation ON media_performance_metrics(operation_name);
CREATE INDEX IF NOT EXISTS idx_media_performance_metrics_date ON media_performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_media_performance_metrics_event_id ON media_performance_metrics(event_id);

-- 5. UPDATE PHOTOS TABLE WITH ADDITIONAL COLUMNS
ALTER TABLE photos ADD COLUMN IF NOT EXISTS file_hash text;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS backup_path text;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS backup_status text DEFAULT 'pending';
ALTER TABLE photos ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- 6. ENABLE RLS ON NEW TABLES
ALTER TABLE media_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_backup_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_performance_metrics ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES - PERMISSIVE FOR DEVELOPMENT
-- WARNING: These are permissive. Tighten in production to limit access.

-- Audit logs policies
CREATE POLICY "media_audit_logs_select_policy" ON media_audit_logs 
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "media_audit_logs_insert_policy" ON media_audit_logs 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Backup metadata policies
CREATE POLICY "media_backup_metadata_select_policy" ON media_backup_metadata 
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "media_backup_metadata_insert_policy" ON media_backup_metadata 
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "media_backup_metadata_update_policy" ON media_backup_metadata 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Security events policies
CREATE POLICY "media_security_events_select_policy" ON media_security_events 
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "media_security_events_insert_policy" ON media_security_events 
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "media_security_events_update_policy" ON media_security_events 
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Performance metrics policies
CREATE POLICY "media_performance_metrics_select_policy" ON media_performance_metrics 
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "media_performance_metrics_insert_policy" ON media_performance_metrics 
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 8. CREATE BACKUP BUCKET (if not exists)
-- Note: This requires Supabase UI since buckets can't be created via SQL
-- Go to Storage > Buckets > Create > Name: "backups"
-- Set to Public: YES (same as photos)
-- Set File Size Limit: 5368709120 (5GB)
-- Set Allowed MIME Types: Same as photos bucket + application/json

-- 9. CREATE FUNCTIONS FOR MAINTENANCE

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days integer DEFAULT 365)
RETURNS TABLE(deleted_count bigint) AS $$
BEGIN
  RETURN QUERY
  WITH deleted AS (
    DELETE FROM media_audit_logs
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
    RETURNING 1
  )
  SELECT COUNT(*)::bigint FROM deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired backups
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS TABLE(deleted_count bigint) AS $$
BEGIN
  RETURN QUERY
  WITH deleted AS (
    DELETE FROM media_backup_metadata
    WHERE expires_at < NOW() AND status = 'verified'
    RETURNING 1
  )
  SELECT COUNT(*)::bigint FROM deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to get audit summary
CREATE OR REPLACE FUNCTION get_audit_summary(event_id_filter text, days integer DEFAULT 7)
RETURNS TABLE(
  total_operations bigint,
  successful_operations bigint,
  failed_operations bigint,
  security_alerts bigint,
  average_duration_ms numeric,
  success_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_operations,
    COUNT(*) FILTER (WHERE status = 'success')::bigint as successful_operations,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint as failed_operations,
    COUNT(*) FILTER (WHERE event_type = 'security_alert')::bigint as security_alerts,
    ROUND(AVG(COALESCE(duration_ms, 0))::numeric, 2) as average_duration_ms,
    ROUND((COUNT(*) FILTER (WHERE status = 'success')::numeric / COUNT(*)::numeric * 100), 2) as success_rate
  FROM media_audit_logs
  WHERE event_id = event_id_filter
    AND created_at >= NOW() - (days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- 10. CREATE SCHEDULED CLEANUP JOBS (via pg_cron if available)
-- Note: These require pg_cron extension

-- Schedule daily audit log cleanup (keep 1 year)
-- SELECT cron.schedule('cleanup_audit_logs', '0 2 * * *', 'SELECT cleanup_old_audit_logs(365)');

-- Schedule daily backup cleanup (keep only non-expired)
-- SELECT cron.schedule('cleanup_expired_backups', '0 3 * * *', 'SELECT cleanup_expired_backups()');

-- 11. VERIFY SETUP
SELECT '✅ Media system tables created successfully' as status;
SELECT COUNT(*) as audit_logs FROM media_audit_logs;
SELECT COUNT(*) as backups FROM media_backup_metadata;
SELECT COUNT(*) as security_events FROM media_security_events;
SELECT COUNT(*) as metrics FROM media_performance_metrics;

-- 12. CREATE BACKUP BUCKET - RUN SEPARATELY IN SUPABASE UI
/*
Instructions:
1. Go to Supabase Dashboard > Storage
2. Click "Create Bucket"
3. Name: "backups"
4. Public: YES
5. File Size Limit: 5368709120 (5GB)
6. Allowed MIME Types:
   - image/jpeg
   - image/jpg
   - image/png
   - image/gif
   - image/webp
   - video/mp4
   - video/mov
   - video/avi
   - video/quicktime
   - video/x-msvideo
   - audio/mpeg
   - audio/wav
   - audio/ogg
   - audio/aac
   - application/json
7. Click "Create Bucket"
8. Add RLS policies (same as photos bucket)
*/

-- 13. VERIFY BUCKETS ARE CONFIGURED
SELECT 'All setup complete! ' || 
       'Remember to:' || CHR(10) ||
       '1. Create "backups" bucket in Supabase UI' || CHR(10) ||
       '2. Set same MIME types + application/json' || CHR(10) ||
       '3. Enable RLS policies' || CHR(10) ||
       '4. Deploy code with new managers' || CHR(10) ||
       '5. Test disaster recovery'
as setup_instructions;
