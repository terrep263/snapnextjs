# Storage Setup Guide

**Time needed**: 5-10 minutes

---

## Step 1: Create Storage Bucket

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Storage** in the left sidebar
4. Click **"New bucket"** button

**Bucket Settings:**
- **Name**: `photos`
- **Public bucket**: ✅ **Yes** (checked)
- **File size limit**: `5368709120` (5GB in bytes)
- **Allowed MIME types**: Leave empty (allow all)

5. Click **"Create bucket"**

---

## Step 2: Configure Storage Policies

1. Click on the **`photos`** bucket you just created
2. Click the **"Policies"** tab at the top
3. You'll see "No policies yet" - we need to add 4 policies

### Policy 1: SELECT (Read/Download)

1. Click **"New Policy"**
2. Choose **"For full customization"**
3. Fill in:
   - **Policy name**: `photos_select`
   - **Allowed operation**: SELECT
   - **Target roles**: `public` (or `anon`)
   - **USING expression**: `true`
4. Click **"Review"** then **"Save policy"**

### Policy 2: INSERT (Upload)

1. Click **"New Policy"** again
2. Choose **"For full customization"**
3. Fill in:
   - **Policy name**: `photos_insert`
   - **Allowed operation**: INSERT
   - **Target roles**: `public` (or `anon`)
   - **WITH CHECK expression**: `bucket_id = 'photos'`
4. Click **"Review"** then **"Save policy"**

### Policy 3: UPDATE (Modify)

1. Click **"New Policy"** again
2. Choose **"For full customization"**
3. Fill in:
   - **Policy name**: `photos_update`
   - **Allowed operation**: UPDATE
   - **Target roles**: `public` (or `anon`)
   - **USING expression**: `bucket_id = 'photos'`
   - **WITH CHECK expression**: `bucket_id = 'photos'`
4. Click **"Review"** then **"Save policy"**

### Policy 4: DELETE (Remove)

1. Click **"New Policy"** again
2. Choose **"For full customization"**
3. Fill in:
   - **Policy name**: `photos_delete`
   - **Allowed operation**: DELETE
   - **Target roles**: `public` (or `anon`)
   - **USING expression**: `bucket_id = 'photos'`
4. Click **"Review"** then **"Save policy"**

---

## Step 3: Verify Setup

You should now see 4 policies listed:
- ✅ `photos_select` (SELECT)
- ✅ `photos_insert` (INSERT)
- ✅ `photos_update` (UPDATE)
- ✅ `photos_delete` (DELETE)

---

## Step 4: Test Upload

1. Go to your app: http://localhost:3000
2. Create or open an event
3. Try uploading a small image (< 5MB)
4. Check if it appears in:
   - Your event gallery
   - Supabase Dashboard → Storage → photos bucket

---

## Troubleshooting

### "Storage bucket not found"
- Make sure you created the bucket named exactly `photos`
- Check bucket is public (toggle should be ON)

### "Permission denied" or "RLS policy violation"
- Verify all 4 policies are created
- Check policy names match exactly
- Ensure target role is `public` or `anon`

### "File too large"
- Default Supabase limit is 50MB
- For larger files, upgrade your Supabase plan
- Or reduce file size limit in app

---

## Done!

Your storage is now configured and ready for uploads! 🎉

**Next**: Test uploading photos and videos in your app.
