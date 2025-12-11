# Sample Gallery Setup - Freebie Event Configuration

## Overview

The sample gallery at `/e/sample-event-slug/gallery` is configured to function exactly like a **freebie event** so you can see the minimum features users get.

## Freebie Event Features

### What Users Get:
- ✅ **Unlimited photo/video uploads** (999,999 max)
- ✅ **Unlimited storage** (~999GB)
- ✅ **Gallery access** with Grid, Masonry, and List layouts
- ✅ **Full-screen lightbox** for viewing media
- ✅ **Social sharing** (8 platforms)
- ✅ **Download individual items** (with watermark)
- ✅ **Bulk download** (with watermark)
- ✅ **QR code** for easy sharing
- ✅ **Event header and profile images**

### What Users DON'T Get (Premium Features):
- ❌ **No live feed** (`feed_enabled = false`)
- ❌ **No password protection** (`password_hash = null`)
- ❌ **No original file downloads** (always watermarked)

### Watermark Behavior:
- **Freebie events**: All downloads include `dlwatermark.png` overlay
- **Images**: Watermark applied using Sharp (bottom center, 30% width)
- **Videos**: Watermark applied using FFmpeg (bottom center, 30% width)
- **Watermark file**: `/public/dlwatermark.png`

## Setup Instructions

### Step 1: Run SQL Script

Execute `setup_sample_freebie_event.sql` in your Supabase SQL Editor:

```sql
-- This will create/update the sample event as a freebie
-- Run the entire script from setup_sample_freebie_event.sql
```

### Step 2: Verify Configuration

Check that the sample event has:
- `is_freebie = true`
- `is_free = true`
- `payment_type = 'freebie'`
- `max_storage_bytes = 999999999`
- `max_photos = 999999`
- `feed_enabled = false`
- `password_hash = null`

### Step 3: Test the Gallery

1. Navigate to: `http://localhost:3000/e/sample-event-slug/gallery`
2. Upload a test photo/video
3. Open it in the lightbox
4. Click "Download" - should show "Download (includes watermark)"
5. Verify the downloaded file has the `dlwatermark.png` overlay

## Testing Watermark

### For Images:
1. Download any image from the sample gallery
2. Check the bottom center of the image
3. Should see `dlwatermark.png` overlay (scaled to 30% of image width)

### For Videos:
1. Download any video from the sample gallery
2. Play the video
3. Should see `dlwatermark.png` overlay at bottom center throughout the video

## Package Type Detection

The system automatically detects freebie events using:
```typescript
if (event.is_freebie === true || event.payment_type === 'freebie') {
  return 'freebie';
}
```

## Download Endpoint Behavior

For freebie events, `/api/download/single`:
1. Detects `packageType = 'freebie'`
2. Loads `dlwatermark.png` from `/public/dlwatermark.png`
3. Applies watermark to image/video
4. Returns watermarked file directly (not a signed URL)

## Console Logging

The download endpoint logs:
- Package type detection
- Watermark application
- File dimensions
- Watermark scaling

Check browser console and server logs when downloading to see the watermark process.

