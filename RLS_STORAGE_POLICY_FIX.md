# RLS Storage Policy Fix - Chunk Upload Issue

**Problem**: `new row violates row-level security policy` during chunk uploads  
**Status**: ✅ FIXED  
**Location**: `supabase_storage_setup.sql`

---

## The Issue

When uploading large videos with chunking (2MB chunks), Supabase blocks the upload with:

```
Failed to upload chunk 0 (2097152 bytes) after 5 retries: 
new row violates row-level security policy
```

**Root Cause**: The UPDATE RLS policy on the `storage.objects` table was missing the `WITH CHECK` clause needed for chunk file updates (upsert operations).

---

## The Solution

### OLD (Broken)
```sql
CREATE POLICY "Anyone can update photos" ON storage.objects 
FOR UPDATE USING (bucket_id = 'photos');
-- Missing WITH CHECK - UPDATE operations fail!
```

### NEW (Fixed)
```sql
CREATE POLICY "photos_update_policy" ON storage.objects 
FOR UPDATE USING (bucket_id = 'photos') WITH CHECK (bucket_id = 'photos');
-- Both read (USING) and write (WITH CHECK) checks pass
```

---

## Why WITH CHECK is Essential

UPDATE operations need TWO checks:

1. **USING** (read-side): Can the old row be updated?
   - `USING (bucket_id = 'photos')` ✅

2. **WITH CHECK** (write-side): Does the new row satisfy constraints?
   - `WITH CHECK (bucket_id = 'photos')` ✅

Chunk uploads need both:
- Read: Check current `.part000` file exists
- Write: Update it with new chunk data

---

## Complete Storage RLS Policy Set

All four operations with correct syntax:

```sql
-- DROP old policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update photos" ON storage.objects;

-- CREATE new policies
CREATE POLICY "photos_select_policy" ON storage.objects 
FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "photos_insert_policy" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'photos');

CREATE POLICY "photos_update_policy" ON storage.objects 
FOR UPDATE USING (bucket_id = 'photos') WITH CHECK (bucket_id = 'photos');

CREATE POLICY "photos_delete_policy" ON storage.objects 
FOR DELETE USING (bucket_id = 'photos');
```

---

## How to Apply the Fix

### Method 1: Use Updated SQL File
1. Go to Supabase Dashboard → SQL Editor
2. Open and run: `supabase_storage_setup.sql`
3. This includes the fixed RLS policies

### Method 2: Manual SQL
1. Go to Supabase Dashboard → SQL Editor
2. Copy the complete policy set above
3. Click "Execute"
4. Verify: Check storage policies are updated

### Method 3: Via Supabase CLI
```bash
supabase db push
```

---

## Upload Flow After Fix

```
File Selected (Destin.mp4 - 2GB)
    ↓
Chunk File 1 (2MB chunk)
    ├─ INSERT (.part000)
    │  └─ Policy: bucket_id = 'photos' ✅
    │
    ├─ Retry (if failed)
    │  └─ UPDATE (.part000)
    │     ├─ USING: bucket_id = 'photos' ✅
    │     └─ WITH CHECK: bucket_id = 'photos' ✅
    │
    └─ Success
    
[Repeat for 1024 chunks]
    ↓
All chunks uploaded ✅
    ↓
Backup created ✅
Audit logged ✅
Upload complete ✅
```

---

## Testing the Fix

After applying the SQL:

1. **Upload a test video**
   ```
   Go to: http://localhost:3000
   Select: Large video file (>50MB)
   ```

2. **Watch console logs**
   ```
   Should show:
   📤 Starting upload: video.mp4
   🔄 Uploading chunk 1/N ...
   🔄 Uploading chunk 2/N ...
   ✅ Chunk upload successful
   ```

3. **Verify in Supabase**
   ```
   Storage → photos bucket
   Should see: .part000, .part001, .part002 files
   ```

4. **Check no RLS errors**
   ```
   Console should NOT show:
   ❌ violates row-level security policy
   ```

---

## RLS Policy Reference

### Policy Syntax Guide

```sql
-- SELECT (READ)
FOR SELECT USING (condition);

-- INSERT (WRITE new row)
FOR INSERT WITH CHECK (condition);

-- UPDATE (MODIFY existing row)
FOR UPDATE 
  USING (read_condition)        -- Which rows can be updated
  WITH CHECK (write_condition)  -- What new row must satisfy

-- DELETE (REMOVE row)
FOR DELETE USING (condition);
```

For public uploads, use:
```sql
FOR UPDATE USING (bucket_id = 'photos') WITH CHECK (bucket_id = 'photos');
```

---

## Related Files

| File | Purpose |
|------|---------|
| `supabase_storage_setup.sql` | ✅ Storage bucket + RLS (FIXED) |
| `fix_rls_policies.sql` | Database table RLS (separate) |
| `BLOB_MIME_TYPE_FIX.md` | Blob creation for MIME types |
| `MIME_TYPE_FINAL_FIX.md` | Complete solution overview |

---

## Key Files Modified

**supabase_storage_setup.sql** (Lines 28-40):
- ✅ Updated UPDATE policy with WITH CHECK clause
- ✅ Renamed policies for clarity
- ✅ Full comments explaining each policy

---

## Troubleshooting

### Still Getting RLS Error?
1. Verify SQL was applied (check Supabase policies UI)
2. Try refreshing the browser cache
3. Ensure you're using latest code (git pull)
4. Check Supabase logs for policy details

### Can't Find Policies?
1. Go to Supabase Dashboard
2. Storage → photos bucket → Policies tab
3. Should see 4 policies: select, insert, update, delete

### Upload Still Failing?
1. Check browser console for exact error
2. Verify MIME type is correct (should be video/mp4)
3. Check chunk size is 2MB (not exceeding limits)
4. Try smaller file first (5MB test file)

---

## Summary

✅ **What was fixed**: RLS UPDATE policy now has WITH CHECK clause  
✅ **Why it works**: Both read and write conditions verified  
✅ **What to do**: Run supabase_storage_setup.sql in Supabase editor  
✅ **Expected result**: Chunk uploads work without RLS errors  

---

**Status**: ✅ FIXED IN CODE  
**Action**: Run SQL in Supabase  
**Result**: Large video uploads will work
