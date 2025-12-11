# SnapWorxx Database Schema Verification

This document verifies that all columns used in the codebase exist in the database schema.

## Events Table - Required Columns

### Base Schema (database_schema.sql)
- ✅ `id` (text, PRIMARY KEY)
- ✅ `name` (text, NOT NULL)
- ✅ `slug` (text, UNIQUE, NOT NULL)
- ✅ `stripe_session_id` (text, UNIQUE)
- ✅ `status` (text, DEFAULT 'active')
- ✅ `created_at` (timestamptz, DEFAULT now())
- ✅ `updated_at` (timestamptz, DEFAULT now())

### Gallery-Specific Columns (used in code)
- ⚠️ `header_image` (text, nullable) - **REQUIRED for gallery header**
- ⚠️ `profile_image` (text, nullable) - **REQUIRED for gallery header**
- ⚠️ `is_freebie` (boolean, nullable) - **REQUIRED for package detection**
- ⚠️ `is_free` (boolean, nullable) - **REQUIRED for package detection**
- ⚠️ `watermark_enabled` (boolean, nullable) - **REQUIRED for download watermarking**
- ⚠️ `max_storage_bytes` (bigint, nullable) - **REQUIRED for upload limits**
- ⚠️ `max_photos` (integer, nullable) - **REQUIRED for upload limits**
- ⚠️ `owner_email` (text, nullable) - **REQUIRED for owner detection**
- ⚠️ `owner_id` (text, nullable) - **REQUIRED for owner detection**
- ⚠️ `feed_enabled` (boolean, nullable) - Used in download API
- ⚠️ `password_hash` (text, nullable) - Used in download API

## Photos Table - Required Columns

### Base Schema (database_schema.sql)
- ✅ `id` (uuid, PRIMARY KEY)
- ✅ `event_id` (text, NOT NULL, REFERENCES events(id))
- ✅ `filename` (text, NOT NULL)
- ✅ `url` (text, NOT NULL)
- ✅ `file_path` (text, NOT NULL)
- ✅ `size` (bigint, nullable) - **USED in code (not file_size)**
- ✅ `type` (text, nullable) - MIME type
- ✅ `created_at` (timestamptz, DEFAULT now())
- ✅ `updated_at` (timestamptz, DEFAULT now())

### Migration Columns (migrations/sprint2_gallery_schema.sql)
- ⚠️ `original_filename` (text, nullable) - **REQUIRED for uploads**
- ⚠️ `storage_url` (text, nullable) - **REQUIRED for transformed URLs**
- ⚠️ `thumbnail_url` (text, nullable) - **REQUIRED for thumbnails**
- ⚠️ `thumbnail_path` (text, nullable) - **REQUIRED for upload API**
- ⚠️ `mime_type` (text, nullable) - **REQUIRED (duplicate of type)**
- ⚠️ `width` (integer, nullable) - **REQUIRED for image dimensions**
- ⚠️ `height` (integer, nullable) - **REQUIRED for image dimensions**
- ⚠️ `is_video` (boolean, DEFAULT false) - **REQUIRED for video detection**
- ⚠️ `is_approved` (boolean, DEFAULT true) - **REQUIRED for moderation**
- ⚠️ `is_flagged` (boolean, DEFAULT false) - **REQUIRED for moderation**
- ⚠️ `flag_reason` (text, nullable) - **REQUIRED for moderation**
- ⚠️ `uploaded_at` (timestamptz, nullable) - **REQUIRED for sorting**
- ⚠️ `user_id` (text, nullable) - **REQUIRED for user filtering**
- ⚠️ `upload_ip` (varchar(45), nullable) - Optional
- ⚠️ `device_info` (jsonb, nullable) - Optional
- ⚠️ `exif_data` (jsonb, nullable) - Optional
- ⚠️ `processed_at` (timestamptz, nullable) - Optional

### Premium Gallery Columns (premium_gallery_schema.sql)
- ⚠️ `title` (text, nullable) - Optional
- ⚠️ `description` (text, nullable) - Optional
- ⚠️ `duration` (integer, nullable) - Optional (for videos)
- ⚠️ `likes` (integer, DEFAULT 0) - Optional
- ⚠️ `is_favorite` (boolean, DEFAULT false) - Optional

## Code Usage Analysis

### Upload API (`src/app/api/upload/chunked/route.ts`)
**Inserting:**
- ✅ `event_id`
- ✅ `filename`
- ✅ `url`
- ✅ `storage_url`
- ✅ `file_path`
- ✅ `thumbnail_url`
- ✅ `thumbnail_path` - **MUST EXIST**
- ✅ `size` - **USING 'size', NOT 'file_size'**
- ✅ `type`
- ✅ `mime_type`
- ✅ `is_video`
- ✅ `width`
- ✅ `height`
- ✅ `is_approved`

### Gallery API (`src/app/api/events/[eventId]/gallery/route.ts`)
**Selecting:**
- ✅ `id`
- ✅ `filename`
- ✅ `original_filename`
- ✅ `url`
- ✅ `storage_url`
- ✅ `thumbnail_url`
- ✅ `width`
- ✅ `height`
- ✅ `created_at`
- ✅ `size` - **USING 'size', NOT 'file_size'**
- ✅ `type`
- ✅ `mime_type`
- ✅ `is_video`
- ✅ `event_id`
- ⚠️ `is_approved` - **REQUIRED for filtering**

**Note:** The code tries to use `uploaded_at` but falls back to `created_at` if it doesn't exist.

### Download API (`src/app/api/download/single/route.ts`)
**Selecting from events:**
- ✅ `id`
- ✅ `name`
- ✅ `slug`
- ✅ `is_freebie`
- ✅ `is_free`
- ✅ `watermark_enabled`
- ✅ `feed_enabled`
- ✅ `password_hash`

**Selecting from photos:**
- ✅ `id`
- ✅ `event_id`
- ✅ `url`
- ✅ `storage_url`
- ✅ `file_path`
- ✅ `is_video`
- ✅ `filename`

## Critical Issues Found

1. **`file_size` vs `size`**: 
   - ❌ Migration adds `file_size` column
   - ✅ Code uses `size` column
   - **FIX**: Code is correct, but migration should not add `file_size` if `size` already exists

2. **`thumbnail_path` column**:
   - ⚠️ Upload API inserts `thumbnail_path`
   - ⚠️ Migration adds `thumbnail_path`
   - **VERIFY**: Ensure this column exists

3. **`is_approved` column**:
   - ⚠️ Gallery API filters by `is_approved`
   - ⚠️ Migration adds `is_approved` with DEFAULT true
   - **VERIFY**: Ensure this column exists

4. **`uploaded_at` column**:
   - ⚠️ Gallery API tries to select `uploaded_at`
   - ⚠️ Code falls back to `created_at` if missing
   - **VERIFY**: Ensure this column exists or code handles gracefully

## Action Items

1. ✅ Run `verify_schema.sql` in Supabase SQL Editor
2. ✅ Verify all columns listed above exist
3. ✅ Check that `size` column exists (not `file_size`)
4. ✅ Ensure `thumbnail_path` exists for uploads
5. ✅ Ensure `is_approved` exists for filtering
6. ✅ Ensure `uploaded_at` exists or code handles gracefully

## Schema Migration Order

1. Run `database_schema.sql` (base schema)
2. Run `migrations/sprint2_gallery_schema.sql` (gallery columns)
3. Run `premium_gallery_schema.sql` (optional premium features)
4. Run `verify_schema.sql` (verification and fixes)

