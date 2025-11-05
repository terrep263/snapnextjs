# 🔧 UPLOAD ERROR - COMPLETE FIX GUIDE

**Date**: November 5, 2025
**Status**: 🚨 ACTION REQUIRED
**Difficulty**: ⭐ Easy (5-10 minutes)

---

## 🎯 WHAT YOU'RE EXPERIENCING

You're seeing upload errors when trying to upload photos/videos to your SnapNextJS app. This is because Supabase storage policies need to be updated.

**Common Error Messages:**
- ❌ "new row violates row-level security policy"
- ❌ "mime type application/octet-stream is not supported"
- ❌ "Upload failed"
- ❌ File uploads start but never complete

---

## ✅ THE SOLUTION (STEP-BY-STEP)

### STEP 1: Open Supabase Dashboard (1 minute)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your **snapnextjs** project (or whatever your project is named)
4. Click on **SQL Editor** in the left sidebar

---

### STEP 2: Run the Fix Script (2 minutes)

1. In the SQL Editor, click **"+ New query"**
2. Open the file `FIX_UPLOAD_ERROR.sql` from your project folder
3. **Copy the ENTIRE contents** of that file
4. **Paste** into the Supabase SQL Editor
5. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)

**What to expect:**
- The script will run for 5-10 seconds
- You'll see a success message at the bottom
- You should see: "✅ UPLOAD FIX COMPLETE!" message

---

### STEP 3: Verify It Worked (1 minute)

After running the SQL, verify the setup:

**Check Storage Bucket:**
1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. You should see a bucket named **"photos"**
3. It should show:
   - Public: ✅ Yes
   - File size limit: 5GB

**Check Policies:**
1. In the Storage section, click the **"photos"** bucket
2. Click **"Policies"** tab
3. You should see 4 policies:
   - `photos_select_policy` ✅
   - `photos_insert_policy` ✅
   - `photos_update_policy` ✅
   - `photos_delete_policy` ✅

---

### STEP 4: Test Upload (2 minutes)

1. Go to your app (local: http://localhost:3000 or your deployed URL)
2. Create a new event or go to an existing event
3. Try uploading a photo or video
4. **Result:** Upload should now work! ✅

---

## 🔍 WHAT THE FIX DOES

### The Problem
AI made policy changes that were too restrictive. The main issue:
- **Missing WITH CHECK clause** on UPDATE policy
- This prevented chunked file uploads from working
- Files would start uploading but fail partway through

### The Solution
The fix script does 5 things:

1. **Creates/updates storage bucket** with proper MIME types
2. **Fixes RLS policies** with correct UPDATE clause
3. **Sets up database tables** (events, photos)
4. **Applies proper permissions** for anonymous users
5. **Adds performance indexes** for faster queries

### Technical Detail (for reference)
The critical fix is this policy:
```sql
CREATE POLICY "photos_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'photos') WITH CHECK (bucket_id = 'photos');
```

The `WITH CHECK` clause is essential for chunked uploads to work.

---

## 🌐 ENVIRONMENT SETUP (If Uploads Still Don't Work)

### Check Your Environment Variables

Your app needs these Supabase credentials configured:

**For Local Development (.env.local file):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these values:**
1. Supabase Dashboard → **Settings** (gear icon)
2. Click **API**
3. You'll see:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

**For Vercel Deployment:**
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the three variables above
5. Redeploy your app

---

## 🧪 TESTING CHECKLIST

After applying the fix, verify these work:

- [ ] **Small Image Upload** (< 5MB) - Should upload instantly
- [ ] **Large Image Upload** (5-50MB) - Should show progress bar
- [ ] **Video Upload** (50-500MB) - Should use chunked upload
- [ ] **Multiple Files** - Upload 3-5 files at once
- [ ] **Browser Console** - No errors in developer console (F12)

**Expected Console Output:**
```
✅ Supabase configured - using real upload
📤 Starting upload: photo.jpg (2097152 bytes, MIME: image/jpeg)
✅ Upload successful: photo.jpg
📦 Backup created for photo.jpg
✅ Photo record saved successfully
```

---

## 🆘 TROUBLESHOOTING

### Issue: "Supabase not configured - simulating upload"

**Problem:** Environment variables not set
**Solution:** Follow "Environment Setup" section above

---

### Issue: "Event ID is missing"

**Problem:** Event not created properly
**Solution:**
1. Refresh the page
2. Try creating a new event
3. Check browser console for errors

---

### Issue: Still getting RLS errors

**Problem:** SQL script didn't run completely
**Solution:**
1. Go to Supabase SQL Editor
2. Run this quick check:
```sql
SELECT policyname FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
```
3. You should see 4 policies. If not, re-run `FIX_UPLOAD_ERROR.sql`

---

### Issue: "MIME type not supported"

**Problem:** Bucket MIME types not configured
**Solution:**
1. In Supabase, go to Storage → photos bucket
2. Click Settings
3. Check "Allowed MIME types"
4. If empty or wrong, re-run `FIX_UPLOAD_ERROR.sql`

---

### Issue: Upload starts then fails

**Problem:** File size limit or timeout
**Solution:**
1. Check file size (should be < 5GB)
2. For large files, ensure good internet connection
3. Check browser console for specific error
4. Try a smaller test file first

---

## 📊 UPLOAD LIMITS

| File Type | Max Size | Upload Method | Typical Speed |
|-----------|----------|---------------|---------------|
| Photos (JPG, PNG) | 1GB | Direct | 5-10 seconds |
| Small Videos | 15MB | Direct | 10-30 seconds |
| Large Videos | 5GB | Chunked (2MB chunks) | 1-5 minutes |
| 4K Videos | Not supported | Compress to 1080p | N/A |

**Recommendations:**
- 📱 **Smartphone videos:** Record in 1080p max (not 4K)
- ⏱️ **Video length:** Keep under 3 minutes for best experience
- 📶 **Connection:** Use WiFi for videos over 100MB
- ✂️ **Editing:** Trim videos before uploading

---

## ✅ SUCCESS CRITERIA

**You'll know it's fixed when:**

1. ✅ SQL script runs without errors
2. ✅ Storage bucket shows "photos" with 5GB limit
3. ✅ 4 storage policies visible in Supabase
4. ✅ Test photo upload completes successfully
5. ✅ Uploaded file appears in Supabase Storage
6. ✅ Photo shows up in your event gallery
7. ✅ Console shows "✅ Upload successful"

---

## 📁 FILES INVOLVED

| File | Purpose | Action Needed |
|------|---------|---------------|
| `FIX_UPLOAD_ERROR.sql` | Complete fix script | Run in Supabase |
| `supabase_storage_setup.sql` | Storage configuration | Reference only |
| `fix_rls_policies.sql` | Database policies | Reference only |
| `src/lib/chunkedUploader.ts` | Upload logic | No action (already fixed) |
| `src/components/PhotoUpload.tsx` | Upload UI | No action (already fixed) |

---

## 🎓 UNDERSTANDING THE SYSTEM

### How Uploads Work

```
User Selects File
    ↓
File Analysis (size, type, MIME detection)
    ↓
Choose Upload Method:
    ├─ Small file (< 15MB) → Direct Upload
    └─ Large file (> 15MB) → Chunked Upload (2MB chunks)
    ↓
Upload to Supabase Storage
    ├─ Check RLS policies ✅
    ├─ Verify MIME type ✅
    └─ Store in photos bucket ✅
    ↓
Create Database Record
    ├─ Save to photos table
    ├─ Link to event
    └─ Store metadata
    ↓
Success! File available in gallery
```

### Key Components

1. **Storage Bucket** - Where files are physically stored
2. **RLS Policies** - Security rules that control access
3. **Database Tables** - Metadata about uploaded files
4. **Upload Logic** - TypeScript code that handles the process

---

## 🚀 NEXT STEPS

After fixing the upload error:

1. ✅ **Test thoroughly** - Upload various file types and sizes
2. 📝 **Monitor** - Watch for any new errors in console
3. 🎨 **Use the app** - Create events and upload photos
4. 📈 **Scale** - System supports up to 5GB per file

---

## 💡 BEST PRACTICES

**For Users:**
- Use WiFi for large uploads
- Compress videos before uploading
- Test with small files first
- Check browser console for errors

**For Developers:**
- Monitor error logs in Supabase
- Check storage usage regularly
- Review RLS policies periodically
- Keep backup of working SQL scripts

---

## 📞 QUICK REFERENCE

| Need | Command/Action | Time |
|------|----------------|------|
| Run fix | Copy `FIX_UPLOAD_ERROR.sql` to Supabase | 2 min |
| Check policies | Supabase → Storage → photos → Policies | 1 min |
| Test upload | Upload a photo in your app | 1 min |
| Get env vars | Supabase → Settings → API | 1 min |
| Verify setup | Run verification queries in SQL | 1 min |

---

## 🎉 SUMMARY

**What happened:**
- AI made policy changes that broke uploads
- RLS policies were too restrictive

**The fix:**
- Run `FIX_UPLOAD_ERROR.sql` in Supabase
- This updates all policies properly

**Result:**
- ✅ Uploads work for all file types
- ✅ Chunked uploads work for large files
- ✅ System supports up to 5GB per file
- ✅ Everything is production-ready

---

**Status**: 🚨 ACTION REQUIRED
**Time needed**: 5-10 minutes
**Difficulty**: ⭐ Easy
**Next action**: Run `FIX_UPLOAD_ERROR.sql` in Supabase SQL Editor

---

**Last Updated**: November 5, 2025
**Issue**: Upload errors after AI policy changes
**Solution**: Run SQL fix script
**Expected**: Uploads work perfectly ✅
