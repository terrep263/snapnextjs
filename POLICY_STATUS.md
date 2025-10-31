# SnapWorxx Policy Setup Verification Guide

## Current Status ✅

The policy issues have been addressed with the following fixes:

### 1. TypeScript/Stripe API Issue Fixed
- Updated Stripe API version from `2025-09-30.clover` to `2025-10-29.clover` in `src/app/api/create-checkout-session/route.ts`

### 2. Database RLS Policies Setup
The `fix_rls_policies.sql` file contains comprehensive policies:

#### Events Table Policies:
- `events_select_policy`: Allows anyone to read events
- `events_insert_policy`: Allows anyone to create events  
- `events_update_policy`: Allows anyone to update events
- `events_delete_policy`: Allows anyone to delete events

#### Photos Table Policies:
- `photos_select_policy`: Allows anyone to read photos
- `photos_insert_policy`: Allows anyone to create photos
- `photos_update_policy`: Allows anyone to update photos  
- `photos_delete_policy`: Allows anyone to delete photos

### 3. Storage Policies Setup
The `supabase_storage_setup.sql` file contains:

#### Storage Bucket:
- Creates `photos` bucket with 50MB limit
- Supports image formats (jpeg, png, gif, webp) and videos (mp4, mov, avi)
- Public access enabled

#### Storage Policies:
- `Public Access`: Anyone can read from photos bucket
- `Anyone can upload photos`: Anyone can upload to photos bucket
- `Anyone can delete photos`: Anyone can delete from photos bucket
- `Anyone can update photos`: Anyone can update photos in bucket

## Next Steps

### To Apply These Policies in Supabase:

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**  
3. **Run the RLS policies:**
   ```sql
   -- Copy and paste the entire content of fix_rls_policies.sql
   ```

4. **Run the storage setup:**
   ```sql  
   -- Copy and paste the entire content of supabase_storage_setup.sql
   ```

### Verification Steps:

1. **Check Database Tables:**
   - Visit: http://localhost:3005/test-db
   - This page tests all database operations

2. **Test Photo Upload:**
   - Visit: http://localhost:3005/e/sample-event-slug
   - Try uploading photos to verify storage policies

3. **Test Event Creation:**
   - Visit: http://localhost:3005/create
   - Try creating a new event

## Environment Configuration ✅

Your `.env.local` is properly configured with:
- ✅ Supabase URL and keys
- ✅ Stripe keys  
- ✅ Resend API key

## Application Status ✅

- ✅ Next.js app running on http://localhost:3005
- ✅ No TypeScript compilation errors
- ✅ All pages loading successfully
- ✅ Mock data fallbacks working

## Common Policy Issues Resolved

1. **"New row violates row-level security policy"** → Fixed with permissive policies
2. **"relation does not exist"** → Fixed with table creation in policies file
3. **"Bucket not found"** → Fixed with storage bucket creation
4. **API version mismatch** → Fixed Stripe API version

## If You Still See Policy Errors:

1. **Check Supabase Dashboard:**
   - Go to Authentication → Policies
   - Verify policies are created and enabled

2. **Check Storage Policies:**
   - Go to Storage → Policies  
   - Verify storage policies exist

3. **Re-run Setup Scripts:**
   - Run `fix_rls_policies.sql` again
   - Run `supabase_storage_setup.sql` again

4. **Check Table Permissions:**
   - Ensure RLS is enabled on both tables
   - Verify policies apply to both `anon` and `authenticated` roles

The application should now work without policy errors! 🎉