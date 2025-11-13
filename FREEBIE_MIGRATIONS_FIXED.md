# Freebie Migration - FIXED

The constraint already exists, so just run these queries in Supabase SQL Editor:

## PASTE THIS - Migration 1 (Safe - Already Exists):

```sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_freebie boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_is_freebie ON public.events(is_freebie);
```

✅ No errors - constraint already exists from previous run

---

## PASTE THIS - Migration 2 (Storage Columns):

```sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS max_storage_bytes bigint DEFAULT 999999999;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_name text DEFAULT 'SnapWorxx Team';

CREATE INDEX IF NOT EXISTS idx_events_max_storage_bytes ON public.events(max_storage_bytes);
```

---

## PASTE THIS - Verify All Columns:

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN ('is_freebie', 'max_storage_bytes', 'owner_name')
ORDER BY column_name;
```

**Expected: 3 rows** ✅
- is_freebie (boolean)
- max_storage_bytes (bigint) 
- owner_name (text)

If all 3 show up, you're done! 🎉
