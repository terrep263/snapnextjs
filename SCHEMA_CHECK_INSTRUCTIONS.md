# Database Schema Verification Instructions

## Quick Check

To verify your database schema matches the codebase requirements:

1. **Open Supabase SQL Editor**
2. **Run `verify_schema.sql`** - This will:
   - Show current table structures
   - Add any missing columns
   - Create supporting tables if needed
   - Generate a verification report

## Critical Columns to Verify

### Events Table
- ✅ `header_image` - Required for gallery header
- ✅ `profile_image` - Required for gallery header  
- ✅ `is_freebie` - Required for package detection
- ✅ `is_free` - Required for package detection
- ✅ `watermark_enabled` - Required for download watermarking
- ✅ `max_storage_bytes` - Required for upload limits
- ✅ `max_photos` - Required for upload limits
- ✅ `owner_email` - Required for owner detection
- ✅ `owner_id` - Required for owner detection

### Photos Table
- ✅ `size` - **CRITICAL** - Code uses `size`, NOT `file_size`
- ✅ `thumbnail_path` - Required for upload API
- ✅ `storage_url` - Required for transformed URLs
- ✅ `thumbnail_url` - Required for thumbnails
- ✅ `is_approved` - Required for filtering
- ✅ `is_video` - Required for video detection
- ✅ `width` / `height` - Required for image dimensions
- ✅ `uploaded_at` - Required for sorting (falls back to `created_at` if missing)

## Common Issues

### Issue 1: `file_size` vs `size`
- **Problem**: Migration adds `file_size` but code uses `size`
- **Solution**: Ensure `size` column exists. `file_size` is optional and not used.

### Issue 2: Missing `thumbnail_path`
- **Problem**: Upload API tries to insert `thumbnail_path` but column doesn't exist
- **Solution**: Run the migration to add `thumbnail_path` column

### Issue 3: Missing `is_approved`
- **Problem**: Gallery API filters by `is_approved` but column doesn't exist
- **Solution**: Run the migration to add `is_approved` column with DEFAULT true

### Issue 4: Missing `uploaded_at`
- **Problem**: Gallery API tries to sort by `uploaded_at` but column doesn't exist
- **Solution**: Run the migration to add `uploaded_at` column, or code will fall back to `created_at`

## Migration Order

Run these in order:

1. `database_schema.sql` - Base schema
2. `migrations/sprint2_gallery_schema.sql` - Gallery columns
3. `verify_schema.sql` - Verification and fixes

## After Running Verification

Check the output for:
- ✅ All required columns show "EXISTS"
- ✅ No critical missing columns
- ✅ Supporting tables created (photo_views, photo_tags, moderation_queue)

If you see any ❌ or ⚠️ warnings, those columns need to be added.

## Testing

After running the schema verification:

1. Try uploading a photo - should work without "column not found" errors
2. Try loading the gallery - should display photos correctly
3. Check browser console - no database errors

If errors persist, check the specific error message and verify that column exists in your database.

