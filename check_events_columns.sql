-- Diagnostic query to check if freebie columns exist in events table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'events' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
