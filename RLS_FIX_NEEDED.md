# Quick RLS Policy Check

## Current Error Status
❌ **"new row violates row-level security policy"**

This error means the database tables exist, but RLS policies haven't been applied yet.

## Immediate Fix Required

### 1. Apply Database Policies
**Go to Supabase Dashboard → SQL Editor → Run this SQL:**

```sql
-- Create permissive policies for photos table  
CREATE POLICY "photos_select_policy" ON photos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "photos_insert_policy" ON photos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "photos_update_policy" ON photos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "photos_delete_policy" ON photos FOR DELETE TO anon, authenticated USING (true);

-- Create permissive policies for events table
CREATE POLICY "events_select_policy" ON events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events_insert_policy" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "events_update_policy" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "events_delete_policy" ON events FOR DELETE TO anon, authenticated USING (true);
```

### 2. Or Use Complete Setup
Run the **entire** `fix_rls_policies.sql` file in Supabase SQL Editor.

## Expected Result
✅ Photo uploads should work without policy errors
✅ Database inserts will succeed  
✅ Storage uploads will continue working

## Test After Fix
Visit: http://localhost:3005/e/sample-event-slug
Try uploading a photo - should work without errors.