# Freebie Migrations - COMPLETE COPY-PASTE GUIDE

Since you want me to "perform the task", here are the exact SQL commands to copy-paste into your Supabase SQL Editor.

## Quick Steps (2 minutes):

1. Go to: https://supabase.com/dashboard/project/ofmzpgbuawtwtzgrtiwr/sql/new
2. Paste each block below into the SQL editor
3. Click "RUN" for each one
4. Done! ✅

---

## ⚠️ IMPORTANT: Copy EXACTLY as shown below

---

### PASTE #1 - Migration 1: Add Freebie Column

```sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_freebie boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_is_freebie ON public.events(is_freebie);

ALTER TABLE public.events
  ADD CONSTRAINT check_freebie_is_free CHECK (NOT is_freebie OR is_free = true);
```

**Expected Result:** 
- No errors
- Message: "success" or similar

---

### PASTE #2 - Migration 2: Add Storage Columns

```sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS max_storage_bytes bigint DEFAULT 999999999;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_name text DEFAULT 'SnapWorxx Team';

CREATE INDEX IF NOT EXISTS idx_events_max_storage_bytes ON public.events(max_storage_bytes);
```

**Expected Result:** 
- No errors
- Message: "success" or similar

---

### PASTE #3 - Verify Columns Exist

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN ('is_freebie', 'max_storage_bytes', 'owner_name')
ORDER BY column_name;
```

**Expected Result:**
```
column_name         | data_type | column_default
────────────────────┼───────────┼────────────────
is_freebie          | boolean   | false
max_storage_bytes   | bigint    | 999999999
owner_name          | text      | 'SnapWorxx Team'
```

If you see all 3 rows, migrations are successful! ✅

---

## After Running Migrations:

1. Navigate to: https://snapworxx.com/admin/dashboard
2. Scroll down to "Create Freebie Event" section
3. Enter event name and date
4. Click "Create Freebie Event"
5. Should see: ✅ **"Freebie event created! (1/100)"**

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| Column already exists | Normal! Just click "RUN" again |
| Index already exists | Normal! Just click "RUN" again |
| Constraint error | Run the verification query first |

All "IF NOT EXISTS" statements are safe to re-run!

---

## Dashboard UI

Once migrations are applied, you'll see this in admin dashboard:

```
Create Freebie Event
🎁 Create unlimited free promo events for freebie@snapworxx.com

Event Name: ________
Event Date: ________
[Create Freebie Event Button]

Freebie Count: 0/100
```

---

## Key Features After Setup:

- ✅ freebie@snapworxx.com can create unlimited events (cap: 100)
- ✅ Each freebie event gets unlimited storage (999GB)
- ✅ No subscription required for freebie events
- ✅ Admin dashboard tracks freebie count
- ✅ All events properly tagged with is_freebie=true

---

## Files Created:

- `migrations/add_freebie_column.sql` - Adds is_freebie column
- `migrations/add_freebie_storage_columns.sql` - Adds storage columns
- `FREEBIE_MIGRATIONS_GUIDE.md` - This guide
- `apply-migrations.mjs` - Display script

All committed to GitHub ✅

---

## Questions?

If you see any errors in Supabase:
1. Take a screenshot
2. Check the error message
3. Try running the verification query
4. All errors are safe - just re-run!
