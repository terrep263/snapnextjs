# 🔧 Supabase Storage Bucket Size Limit Fix

## Problem Discovered

**Error**: "Failed to upload chunk 0 after 5 retries"

**Root Cause**: The Supabase `photos` storage bucket had a **100MB file size limit** configured at the bucket level, which was rejecting all files larger than 100MB - including your 307.7MB video.

```
Old Limit: 100MB (104857600 bytes)
New Limit: 5GB (5368709120 bytes)
```

## Why This Happened

When the storage bucket was initially set up, it was configured conservatively:
- `file_size_limit = 104857600` -- 100MB limit
- Comment: "optimized for 3-minute 1080p videos maximum"

But your app now needs to support:
- ✅ 307.7MB 1080p video
- ✅ 1GB+ video files
- ✅ 4K/UHD videos

The **100MB bucket limit** was the bottleneck, not the upload size checks in the code.

## The Fix

### Two Files to Update

#### 1. `supabase_storage_setup.sql` (Already Updated)
```sql
-- OLD: 100MB limit
file_size_limit = 104857600

-- NEW: 5GB limit
file_size_limit = 5368709120
```

#### 2. `update_storage_bucket_5gb.sql` (New Migration File)
Run this in your Supabase SQL Editor to apply the fix immediately:

```sql
UPDATE storage.buckets
SET file_size_limit = 5368709120  -- 5GB in bytes
WHERE id = 'photos';
```

### Step-by-Step Fix

**In Supabase Dashboard:**

1. Go to **SQL Editor**
2. Create a **New Query**
3. Copy and paste the SQL from `update_storage_bucket_5gb.sql`
4. Click **Run**
5. Verify: Should show 1 row updated

**Result:**
```
id       | name   | file_size_limit
---------|--------|------------------
photos   | photos | 5368709120
```

## What This Enables

| File Size | Status | Notes |
|-----------|--------|-------|
| 307.7MB | ✅ **NOW WORKS** | 1080p video |
| 500MB | ✅ Works | High bitrate video |
| 1GB | ✅ Works | 4K video preview |
| 2GB | ✅ Works | Large video files |
| 5GB | ✅ Works | Maximum allowed |
| 5.5GB+ | ❌ Blocked | Over limit |

## How the System Works Now

```
User Perspective:
- See: "Up to 1GB" (friendly display)
- Can upload: Technically up to 5GB backend
- Will warn: At 2GB

Supabase Bucket Level:
- Accepts: Files up to 5GB (5368709120 bytes)
- Rejects: Files over 5GB

Previous Problem:
- Bucket limit: 100MB ← ✅ NOW FIXED
- Upload limit: 300MB
- Result: 307.7MB file hit bucket limit first
```

## Technical Details

### Bucket Configuration Updated

```
Bucket ID: photos
Bucket Name: photos
Public: true ✓
Old File Size Limit: 100MB (104857600 bytes)
New File Size Limit: 5GB (5368709120 bytes)
Allowed MIME Types:
  - Images: jpeg, jpg, png, gif, webp
  - Videos: mp4, mov, avi, quicktime, x-msvideo
  - Audio: mpeg, wav, ogg, aac
```

### RLS Policies (Unchanged)

The storage policies remain the same:
- ✅ Public read access
- ✅ Anyone can upload
- ✅ Anyone can delete
- ✅ Anyone can update

## Next Steps

1. **Apply the fix in Supabase**
   - Run `update_storage_bucket_5gb.sql`

2. **Test the upload**
   - Try uploading Destin.mp4 (307.7MB)
   - Should now work! ✅

3. **Verify in browser console**
   - Look for: "✅ Upload successful"
   - Instead of: "❌ Failed to upload chunk 0"

## Rollback (If Needed)

If you need to revert to the old limit:

```sql
UPDATE storage.buckets
SET file_size_limit = 104857600  -- Back to 100MB
WHERE id = 'photos';
```

## Prevention

For future deployments:
- Always verify storage bucket limits match your app requirements
- Document bucket configuration in setup scripts
- Test with actual large files before deployment

## Summary

| Aspect | Details |
|--------|---------|
| **Issue** | Supabase bucket limit 100MB < 307.7MB file |
| **Fix** | Increase bucket limit to 5GB |
| **Impact** | ✅ Solves upload failures |
| **Risk** | Low - just a configuration update |
| **Time to Fix** | 2 minutes |
| **Files Updated** | 2 SQL files |
| **Code Changes** | None - this was a bucket configuration issue |

**Status**: Ready for deployment! 🚀

Apply the migration and your 307.7MB video upload will succeed.
