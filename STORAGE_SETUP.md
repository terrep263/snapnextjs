# 🗂️ Supabase Storage Configuration Guide

## Step 1: Run the Storage Setup SQL

1. **Open your Supabase Dashboard**: https://app.supabase.com
2. **Navigate to SQL Editor**: Click "SQL Editor" in the left sidebar
3. **Copy and paste** the contents of `supabase_storage_setup.sql`
4. **Click "Run"** to execute the SQL commands

This will:
- ✅ Create the 'photos' storage bucket
- ✅ Set up proper access policies
- ✅ Configure file size limits (50MB)
- ✅ Allow image and video uploads

## Step 2: Verify Your Environment Variables

Your `.env.local` should have:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ofmzpgbuawtwtzgrtiwr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **Your credentials are already configured!**

## Step 3: Test the Upload

1. **Start the dev server**: `npm run dev`
2. **Visit**: http://localhost:3003/e/test
3. **Try uploading a photo**
4. **Check the upload status indicator**:
   - 🟡 **Yellow**: Demo mode (simulated uploads)
   - 🟢 **Green**: Real uploads to Supabase

## Step 4: Verify in Supabase Dashboard

After uploading, check:
1. **Storage → photos bucket**: Should show uploaded files
2. **Table Editor → photos table**: Should show database records

## Your Storage URL
Your Supabase storage is configured at:
- **Storage Endpoint**: `https://ofmzpgbuawtwtzgrtiwr.storage.supabase.co`
- **Bucket Name**: `photos`
- **File Path Structure**: `events/{event_id}/{timestamp}_{random}.{ext}`

## Security Policies

Current policies allow:
- ✅ **Public read access** (anyone can view photos)
- ✅ **Public upload access** (anyone can upload to events)
- ✅ **Public delete access** (for gallery management)

**Note**: You can restrict these later by modifying the policies to check for authentication or specific user permissions.

## Troubleshooting

### Upload shows "Demo Mode"
- ❌ Check your environment variables are correct
- ❌ Ensure you ran the SQL setup script
- ❌ Verify the 'photos' bucket exists in Supabase

### Upload fails with error
- ❌ Check browser console for detailed error messages
- ❌ Verify file size is under 50MB
- ❌ Ensure file type is supported (images/videos only)
- ❌ Check Supabase logs in the dashboard

### Database records not created
- ❌ Ensure your `events` table exists
- ❌ Check the `photos` table schema matches the insert query
- ❌ Verify RLS policies allow inserts

## Next Steps

Once storage is working:
1. **Test on mobile devices** (drag & drop + camera upload)
2. **Set up email notifications** when photos are uploaded
3. **Add image optimization** (automatic resizing/compression)
4. **Configure CDN** for faster image loading
5. **Add admin controls** for photo moderation

## Support

If you need help:
1. Check the browser console for errors
2. Review Supabase logs in the dashboard
3. Test with a simple image first (JPEG, under 5MB)
4. Verify your internet connection and Supabase status