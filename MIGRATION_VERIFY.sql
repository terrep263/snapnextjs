SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('owner_id', 'owner_email', 'payment_type', 'is_freebie', 'max_storage_bytes')
ORDER BY column_name;
