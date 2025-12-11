# Sample Gallery Freebie Setup Guide

## Overview

The sample gallery at `/e/sample-event-slug/gallery` is configured to function exactly like a **Freebie Package** event. This allows you to test and demonstrate how the freebie system works in a live environment.

## Freebie Package Features

### What Freebie Users Get:

1. **Unlimited Photo/Video Uploads**
   - No storage limits
   - No photo count limits
   - Guests can upload as many photos/videos as they want

2. **Watermarked Downloads**
   - All downloads include `dlwatermark.png` overlay
   - Applied to both images and videos
   - Watermark is positioned at bottom center, scaled to 30% of media width

3. **No Premium Features**
   - No live feed (`feed_enabled = false`)
   - No password protection
   - No advanced analytics

4. **Full Gallery Access**
   - Grid, Masonry, and List layouts
   - Full-screen lightbox
   - Social sharing (8 platforms)
   - Upload functionality

## Setup Instructions

### 1. Run the SQL Script

Execute `ensure_sample_freebie.sql` in your Supabase SQL Editor to configure the sample event:

```sql
-- This will:
-- - Set is_freebie = true
-- - Set payment_type = 'freebie'
-- - Set unlimited storage and photos
-- - Disable premium features
```

### 2. Verify Configuration

After running the script, verify the event is configured correctly:

```sql
SELECT 
  id,
  name,
  slug,
  is_freebie,
  is_free,
  payment_type,
  max_storage_bytes,
  max_photos,
  feed_enabled,
  watermark_enabled
FROM events
WHERE slug = 'sample-event-slug';
```

Expected values:
- `is_freebie`: `true`
- `is_free`: `true`
- `payment_type`: `'freebie'`
- `max_storage_bytes`: `999999999` (unlimited)
- `max_photos`: `999999` (unlimited)
- `feed_enabled`: `false`
- `watermark_enabled`: `false` (watermark always applied for freebie)

### 3. Test Freebie Features

#### Download Test:
1. Open the sample gallery: `http://localhost:3000/e/sample-event-slug/gallery`
2. Click on any photo/video to open lightbox
3. Click the Download button
4. **Expected**: Download should include `dlwatermark.png` overlay
5. **Check console**: Should see logs showing `packageType: 'freebie'` and watermark being applied

#### Upload Test:
1. Click "Upload Photos & Videos" button
2. Upload multiple photos/videos
3. **Expected**: No limits, all uploads should succeed

#### Gallery Features:
1. Switch between Grid, Masonry, and List layouts
2. Open lightbox and navigate between items
3. Test social sharing
4. **Expected**: All features should work normally

## Package Detection Logic

The system detects freebie events using this logic (in `src/lib/gallery-utils.ts`):

```typescript
export function getPackageType(event: EventData): PackageType {
  // Freebie: explicitly marked as freebie
  if (event.is_freebie === true || event.payment_type === 'freebie') {
    return 'freebie';
  }
  // ... other package types
}
```

## Download Watermarking

For freebie events, downloads use `dlwatermark.png` from `/public` folder:

- **Images**: Overlay applied using Sharp (bottom center, 30% width)
- **Videos**: Overlay applied using FFmpeg (bottom center, 30% width)
- **Location**: `public/dlwatermark.png`

## Console Logging

When viewing the sample gallery, check the browser console for:

- `✅ Event loaded:` - Shows package type detection
- `📦 Download request:` - Shows package type and watermark status
- `✅ Applied dlwatermark.png` - Confirms watermark was applied

## Troubleshooting

### Images Not Showing Watermark:
1. Check console logs for package type detection
2. Verify `is_freebie = true` in database
3. Verify `dlwatermark.png` exists in `/public` folder
4. Check download API logs for watermark application

### Package Type Not Detected as Freebie:
1. Run `ensure_sample_freebie.sql` script
2. Verify database values match expected configuration
3. Check console logs for package type detection
4. Refresh the page to reload event data

### Upload Limits:
1. Verify `max_storage_bytes` and `max_photos` are set to high values
2. Check upload modal for any limit messages
3. Verify event data is loaded correctly

## Production Behavior

In production, freebie events will:
- Show watermarked downloads to all users
- Allow unlimited uploads
- Display "Download (includes watermark)" message
- Function identically to the sample gallery

The sample gallery is a perfect testing ground for freebie functionality!

