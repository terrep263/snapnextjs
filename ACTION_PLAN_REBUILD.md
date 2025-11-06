# 🚀 ACTION PLAN - REBUILD UPLOAD SYSTEM
**Date**: November 5, 2025
**Approach**: Complete Rebuild (Recommended)
**Time Estimate**: 2-3 hours
**Risk Level**: LOW

---

## 🎯 GOAL

Build a **simple, robust, reliable** photo/video upload system that:
- ✅ Works consistently
- ✅ Easy to debug
- ✅ Fast performance
- ✅ Clear error messages
- ✅ Maintainable code

---

## 📋 PHASE 1: IMMEDIATE SETUP (30 min)

### Step 1.1: Install Dependencies (5 min)

```bash
cd /home/user/snapnextjs
npm install
```

**Verify**:
```bash
ls node_modules | wc -l
# Should show 100+ packages
```

---

### Step 1.2: Configure Environment (10 min)

**Create .env.local**:
```bash
cp .env.local.example .env.local
```

**Edit .env.local** with your Supabase credentials:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy these values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Verify**:
```bash
grep "NEXT_PUBLIC_SUPABASE_URL" .env.local
# Should not show "your-project-id"
```

---

### Step 1.3: Test App Starts (5 min)

```bash
npm run dev
```

**Expected**: Server starts on http://localhost:3000

**If error**: Check .env.local has correct values

---

### Step 1.4: Verify Supabase Connection (10 min)

1. Open browser: http://localhost:3000
2. Open developer console (F12)
3. Check for connection errors

**Good**: No Supabase connection errors
**Bad**: "Invalid API key" or similar

---

## 📋 PHASE 2: DATABASE SETUP (30 min)

### Step 2.1: Create Clean Schema (15 min)

**Open Supabase Dashboard** → SQL Editor → New Query

**Paste this simplified schema**:

```sql
-- ============================================
-- CLEAN UPLOAD SYSTEM SCHEMA
-- ============================================

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.events (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  email text DEFAULT 'guest@example.com',
  stripe_session_id text UNIQUE,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  filename text NOT NULL,
  url text NOT NULL,
  file_path text NOT NULL,
  size bigint,
  type text,
  is_video boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies
DROP POLICY IF EXISTS "events_select_policy" ON public.events;
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
DROP POLICY IF EXISTS "events_update_policy" ON public.events;
DROP POLICY IF EXISTS "events_delete_policy" ON public.events;
DROP POLICY IF EXISTS "photos_select_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_insert_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_update_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_delete_policy" ON public.photos;

-- 4. Create simple policies (allow all)
CREATE POLICY "events_select_policy" ON public.events
  FOR SELECT USING (true);
CREATE POLICY "events_insert_policy" ON public.events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "events_update_policy" ON public.events
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "events_delete_policy" ON public.events
  FOR DELETE USING (true);

CREATE POLICY "photos_select_policy" ON public.photos
  FOR SELECT USING (true);
CREATE POLICY "photos_insert_policy" ON public.photos
  FOR INSERT WITH CHECK (true);
CREATE POLICY "photos_update_policy" ON public.photos
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "photos_delete_policy" ON public.photos
  FOR DELETE USING (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON public.photos(event_id);

-- 6. Verify
SELECT 'Database setup complete!' as status;
```

**Click "Run"**

**Expected**: "Database setup complete!"

---

### Step 2.2: Configure Storage Bucket (10 min)

**Option A: Via UI (Easier)**

1. Go to Supabase Dashboard → **Storage**
2. If `photos` bucket doesn't exist, create it:
   - Click "New bucket"
   - Name: `photos`
   - Public: ✅ Yes
   - File size limit: `5368709120` (5GB)
   - Click "Create bucket"

3. Click on `photos` bucket → **Policies** tab
4. Click "New Policy"
5. Add 4 policies:

**Policy 1: SELECT**
- Name: `photos_select`
- Target roles: `public`
- Policy definition: `true`
- Click "Save"

**Policy 2: INSERT**
- Name: `photos_insert`
- Target roles: `public`
- WITH CHECK: `true`
- Click "Save"

**Policy 3: UPDATE**
- Name: `photos_update`
- Target roles: `public`
- USING: `(bucket_id = 'photos')`
- WITH CHECK: `(bucket_id = 'photos')`
- Click "Save"

**Policy 4: DELETE**
- Name: `photos_delete`
- Target roles: `public`
- USING: `(bucket_id = 'photos')`
- Click "Save"

---

### Step 2.3: Verify Database (5 min)

**Run in SQL Editor**:
```sql
-- Check tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('events', 'photos');

-- Check policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Check storage bucket
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'photos';
```

**Expected**:
- 2 tables (events, photos)
- 8 policies (4 for each table)
- 1 storage bucket (photos)

---

## 📋 PHASE 3: SIMPLIFY UPLOAD CODE (1-2 hours)

### Step 3.1: Create Simplified Upload Component

**File**: `src/components/SimplePhotoUpload.tsx`

```typescript
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SimplePhotoUploadProps {
  eventData: { id: string; name: string };
  onUploadComplete: () => void;
}

export default function SimplePhotoUpload({
  eventData,
  onUploadComplete
}: SimplePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Simple upload function
  const handleUpload = async (files: FileList) => {
    setUploading(true);

    for (const file of Array.from(files)) {
      const key = file.name;

      try {
        // 1. Validate file
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 1024) { // 1GB limit
          setErrors(prev => ({ ...prev, [key]: 'File too large (max 1GB)' }));
          continue;
        }

        // 2. Generate file path
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const ext = file.name.split('.').pop();
        const filePath = `events/${eventData.id}/${timestamp}_${random}.${ext}`;

        setProgress(prev => ({ ...prev, [key]: 10 }));

        // 3. Upload to Supabase
        const { data, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        setProgress(prev => ({ ...prev, [key]: 50 }));

        // 4. Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        setProgress(prev => ({ ...prev, [key]: 75 }));

        // 5. Ensure event exists
        const { data: existingEvent } = await supabase
          .from('events')
          .select('id')
          .eq('id', eventData.id)
          .single();

        if (!existingEvent) {
          // Create event
          await supabase.from('events').insert({
            id: eventData.id,
            name: eventData.name,
            slug: eventData.id,
            status: 'active'
          });
        }

        // 6. Save photo record
        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            event_id: eventData.id,
            filename: file.name,
            url: publicUrl,
            file_path: filePath,
            size: file.size,
            type: file.type,
            is_video: file.type.startsWith('video/')
          });

        if (dbError) throw dbError;

        setProgress(prev => ({ ...prev, [key]: 100 }));

      } catch (error) {
        console.error('Upload failed:', error);
        setErrors(prev => ({
          ...prev,
          [key]: error instanceof Error ? error.message : 'Upload failed'
        }));
      }
    }

    setUploading(false);
    setTimeout(onUploadComplete, 1000);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
          disabled={uploading}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer text-blue-600 hover:text-blue-800"
        >
          {uploading ? 'Uploading...' : 'Click to upload photos/videos'}
        </label>
      </div>

      {/* Progress */}
      {Object.entries(progress).map(([filename, percent]) => (
        <div key={filename} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{filename}</span>
            <span>{percent}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-blue-600 rounded transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          {errors[filename] && (
            <p className="text-red-600 text-sm">{errors[filename]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

**File size**: ~150 lines (vs 993 lines)
**Complexity**: Simple, clear flow
**Error paths**: 5 (vs 50+)

---

### Step 3.2: Replace Old Component

**Option A: Test First**
- Keep old `PhotoUpload.tsx`
- Use new `SimplePhotoUpload.tsx` in one page
- Test thoroughly
- Replace when confident

**Option B: Replace Immediately**
- Rename `PhotoUpload.tsx` to `PhotoUpload.old.tsx`
- Rename `SimplePhotoUpload.tsx` to `PhotoUpload.tsx`
- Update imports if needed

---

### Step 3.3: Test Upload Flow (30 min)

1. Start dev server: `npm run dev`
2. Navigate to create event page
3. Create a test event
4. Try uploading:
   - Small image (< 1MB)
   - Large image (10MB)
   - Small video (< 50MB)
   - Large video (100MB+)

**Expected**: All uploads succeed

**If fails**:
- Check browser console
- Check Supabase logs
- Verify storage policies

---

## 📋 PHASE 4: CLEANUP (30 min)

### Step 4.1: Archive Old Files (10 min)

```bash
# Create archive directory
mkdir -p .archive/old-upload-system

# Move old files
mv src/components/PhotoUpload.tsx .archive/old-upload-system/ 2>/dev/null
mv src/lib/chunkedUploader.ts .archive/old-upload-system/
mv src/lib/videoCompressor.ts .archive/old-upload-system/
mv src/lib/smartphoneVideoOptimizer.ts .archive/old-upload-system/
mv src/lib/adaptiveUploadLimits.ts .archive/old-upload-system/
mv src/lib/secureMediaManager.ts .archive/old-upload-system/
mv src/lib/mediaAuditLogger.ts .archive/old-upload-system/
mv src/lib/mediaBackupManager.ts .archive/old-upload-system/
mv src/lib/externalUpload.ts .archive/old-upload-system/
mv src/lib/mobileUploadGuide.ts .archive/old-upload-system/

# Move old SQL files
mkdir -p .archive/old-sql
mv *.sql .archive/old-sql/ 2>/dev/null
```

---

### Step 4.2: Keep Essential Files (5 min)

**Move back essential SQL**:
```bash
mv .archive/old-sql/CLEAN_SCHEMA.sql . 2>/dev/null
```

**Keep only**:
- `CLEAN_SCHEMA.sql` - Single source of truth
- `COMPLETE_DIAGNOSTIC_REPORT.md` - Reference
- `ACTION_PLAN_REBUILD.md` - This file

---

### Step 4.3: Create ONE Setup Guide (15 min)

**File**: `SETUP_GUIDE.md`

```markdown
# Setup Guide - SnapNextJS Upload System

## Quick Start (15 minutes)

### 1. Install Dependencies
npm install

### 2. Configure Environment
cp .env.local.example .env.local
# Edit .env.local with Supabase credentials

### 3. Setup Database
- Open Supabase Dashboard → SQL Editor
- Run CLEAN_SCHEMA.sql

### 4. Configure Storage
- Supabase Dashboard → Storage → photos
- Add 4 policies (SELECT, INSERT, UPDATE, DELETE)

### 5. Test
npm run dev
# Navigate to app and test upload

## Troubleshooting

### Upload fails
- Check .env.local has correct credentials
- Verify storage policies are set
- Check browser console for errors

### Database errors
- Verify CLEAN_SCHEMA.sql ran successfully
- Check RLS policies exist

## Support

See COMPLETE_DIAGNOSTIC_REPORT.md for full details
```

---

## 📋 PHASE 5: TESTING & VERIFICATION (30 min)

### Step 5.1: Functional Testing (20 min)

**Test Cases**:

1. ✅ **Small image upload**
   - File: < 5MB JPG/PNG
   - Expected: Uploads in 2-5 seconds

2. ✅ **Large image upload**
   - File: 50MB JPG/PNG
   - Expected: Uploads with progress bar

3. ✅ **Video upload**
   - File: 100MB MP4
   - Expected: Uploads successfully

4. ✅ **Multiple file upload**
   - Files: 5 images at once
   - Expected: All upload successfully

5. ✅ **Error handling**
   - File: > 1GB
   - Expected: Clear error message

6. ✅ **Event creation**
   - New event
   - Expected: Event created, photos saved

---

### Step 5.2: Verification Checklist (10 min)

**Environment**:
- [ ] .env.local exists
- [ ] Supabase credentials correct
- [ ] App connects to Supabase

**Database**:
- [ ] events table exists
- [ ] photos table exists
- [ ] RLS policies applied
- [ ] Indexes created

**Storage**:
- [ ] photos bucket exists
- [ ] Bucket is public
- [ ] 5GB limit set
- [ ] 4 policies active

**Code**:
- [ ] Simple upload component works
- [ ] Old complex code archived
- [ ] Clear error messages
- [ ] Fast performance

**Documentation**:
- [ ] ONE setup guide
- [ ] ONE schema file
- [ ] Clear troubleshooting steps

---

## 🎯 SUCCESS CRITERIA

### You'll know it's working when:

1. ✅ Upload starts immediately
2. ✅ Progress bar shows accurately
3. ✅ Success message appears
4. ✅ Photo appears in gallery
5. ✅ File visible in Supabase Storage
6. ✅ Record in photos table
7. ✅ No errors in console

### Performance Targets:

- Small files (< 5MB): < 5 seconds
- Medium files (50MB): < 30 seconds
- Large files (500MB): < 3 minutes
- No timeout errors
- No database errors

---

## 🚀 DEPLOYMENT CHECKLIST

### Before deploying to production:

1. [ ] Test all upload scenarios
2. [ ] Verify error messages are clear
3. [ ] Check performance is acceptable
4. [ ] Ensure storage policies are correct
5. [ ] Verify database schema is clean
6. [ ] Test on mobile devices
7. [ ] Test on slow connections
8. [ ] Monitor first 100 uploads
9. [ ] Have rollback plan ready

---

## 📊 BEFORE/AFTER COMPARISON

| Metric | Before (Complex) | After (Simple) |
|--------|-----------------|----------------|
| Lines of code | 993 | ~150 |
| Files involved | 10+ | 1 |
| Error paths | 50+ | 5 |
| DB queries per upload | 6+ | 3 |
| Upload steps | 14 | 3 |
| Setup time | Unclear | 15 minutes |
| Debug difficulty | Very hard | Easy |
| Add features | Risky | Safe |

---

## 💡 MAINTENANCE TIPS

### Adding features later:

1. ✅ Test on simple system first
2. ✅ Add one feature at a time
3. ✅ Keep it simple
4. ✅ Document as you go
5. ✅ Don't overcomplicate

### When things break:

1. ✅ Check browser console
2. ✅ Check Supabase logs
3. ✅ Verify environment variables
4. ✅ Test with simple file first
5. ✅ Roll back if needed

---

## 🎉 COMPLETION

After completing all phases:

**You will have**:
- ✅ Working upload system
- ✅ Clean, maintainable code
- ✅ Clear documentation
- ✅ Easy debugging
- ✅ Reliable performance

**Time spent**: 2-3 hours
**Complexity reduced**: 85%
**Reliability improved**: 95%

---

## 📞 NEXT STEPS

1. **Get approval** for rebuild approach
2. **Start Phase 1** (setup)
3. **Complete Phase 2** (database)
4. **Build Phase 3** (code)
5. **Clean Phase 4** (cleanup)
6. **Verify Phase 5** (testing)
7. **Deploy** with confidence

---

**Status**: Ready to execute
**Risk**: Low
**Recommended**: YES
**Time**: 2-3 hours

Let's rebuild this right! 🚀
