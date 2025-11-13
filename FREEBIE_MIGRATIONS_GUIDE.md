# How to Apply Freebie Event Migrations

## What Needs to Be Done

Your freebie@snapworxx.com feature requires the following database columns. Follow these steps to apply them:

## Step 1: Go to Supabase SQL Editor

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Replace `YOUR_PROJECT` with your actual project ID

## Step 2: Run Migrations in Order

Copy and paste each migration into the SQL editor and run it:

### Migration 1: Add Freebie Column
```sql
-- Add is_freebie column to track master email (freebie@snapworxx.com) events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_freebie boolean NOT NULL DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_is_freebie ON public.events(is_freebie);

-- Add check to ensure freebie events are also marked as free
ALTER TABLE public.events
  ADD CONSTRAINT check_freebie_is_free CHECK (NOT is_freebie OR is_free = true);
```

### Migration 2: Add Storage and Owner Columns
```sql
-- Add max_storage_bytes column (storage limit in bytes for freebie events)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS max_storage_bytes bigint DEFAULT 999999999;

-- Add owner_name column (who owns/created the event)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_name text DEFAULT 'SnapWorxx Team';

-- Create indexes for queries
CREATE INDEX IF NOT EXISTS idx_events_max_storage_bytes ON public.events(max_storage_bytes);
```

## Step 3: Verify Columns Were Created

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY column_name;
```

Look for these new columns:
- ✅ `is_freebie` (boolean)
- ✅ `max_storage_bytes` (bigint)
- ✅ `owner_name` (text)

## Step 4: Test Freebie Event Creation

1. Go to your admin dashboard: https://snapworxx.com/admin/dashboard
2. Click "Create Freebie Event"
3. Enter event name and date
4. Click "Create"
5. You should see: "✅ Freebie event created! (1/100)"

## Step 5: Verify in Supabase

Run this query to see freebie events:
```sql
SELECT id, name, email, is_freebie, max_storage_bytes, owner_name 
FROM public.events 
WHERE email = 'freebie@snapworxx.com' 
ORDER BY created_at DESC;
```

## Troubleshooting

**Error: Column "is_freebie" does not exist**
- Run Migration 1 above

**Error: Column "max_storage_bytes" does not exist**
- Run Migration 2 above

**Admin dashboard button doesn't work**
- Verify all migrations have been applied
- Check browser console for errors (F12 → Console tab)
- Check Supabase logs for database errors

## Next: Deploy to Production

Once verified locally:
```bash
git add -A
git commit -m "docs: Add freebie migration guides"
git push origin main
```

Vercel will auto-deploy. Check https://snapworxx.com/admin/dashboard to test on production.
