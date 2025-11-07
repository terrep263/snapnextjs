# Gallery Header & Profile Images - Setup Guide

## Overview
The event gallery now supports header and profile images that are uploaded via the dashboard and displayed in the event gallery page.

## How It Works

### 1. **Upload Images on Dashboard**
- Navigate to `/dashboard/[eventId]`
- Look for the "Add Header Image" and "Add Profile Image" buttons
- Click to upload images (stored as base64 data URLs in database)
- Images appear immediately on the dashboard

### 2. **Images Displayed in Gallery**
- Navigate to `/e/[slug]` (the event gallery page)
- Images are loaded from the database `events` table (`header_image` and `profile_image` columns)
- They appear at the top of the masonry gallery with type badges:
  - 📸 = Header Image
  - 👤 = Profile Image
  - 🎬 = Video
  - 📷 = Photo

### 3. **Full Gallery Features**
- Masonry/grid layout
- Slideshow with auto-advance (5 seconds)
- Fullscreen lightbox view
- Type badges for all items
- Bulk download (all items as ZIP)
- Selective download (choose specific items)
- Share via: link, device, or email
- Selection mode for managing items

## Database Schema

```sql
ALTER TABLE events ADD COLUMN header_image text;
ALTER TABLE events ADD COLUMN profile_image text;
```

Both columns store base64 data URLs of the images.

## Testing the Feature

### Method 1: Manual Upload (Recommended)
1. Go to `/dashboard/sample-event-id`
2. Click "Add Header Image" button
3. Select an image file
4. Click "Add Profile Image" button
5. Select another image file
6. Navigate to `/e/sample-event-slug`
7. Both images should appear at the top of the gallery with badges

### Method 2: Direct Database Insert
```sql
UPDATE events 
SET 
  header_image = 'data:image/jpeg;base64,...',
  profile_image = 'data:image/jpeg;base64,...'
WHERE slug = 'sample-event-slug';
```

## File Locations

- **Dashboard Page**: `src/app/dashboard/[id]/page.tsx`
  - Image upload functions: `handleImageUpload()`, `removeImage()`
  - Upload state: `headerImage`, `profileImage`

- **Gallery Page**: `src/app/e/[slug]/page.tsx`
  - Image loading: `loadEvent()` function
  - Loads `header_image` and `profile_image` from database

- **Gallery Component**: `src/components/SimpleEventGallery.tsx`
  - Receives images as props
  - Includes images in `allItems` array
  - Renders with type badges

## Console Logging

The following logs help debug the feature:

**On Event Page Load:**
```
🔍 Loading event: sample-event-slug
✅ Real event loaded: {...}
📊 Event fields: [...]
🖼️ Event images field values: {header: ..., profile: ..., ...}
✅ Header image set: data:image/jpeg;base64,...
✅ Profile image set: data:image/png;base64,...
```

**In Gallery Component:**
```
🎨 SimpleEventGallery mounted with: {
  eventName: "...",
  headerImageExists: true,
  profileImageExists: true,
  photosCount: 7
}
📸 Adding header image to gallery
👤 Adding profile image to gallery
📊 Total gallery items: 9 items
```

## Troubleshooting

### Images Not Showing in Gallery
1. Check browser console for logs
2. Verify images are uploaded in dashboard first
3. Check database:
   ```sql
   SELECT id, name, header_image, profile_image 
   FROM events 
   WHERE slug = 'sample-event-slug';
   ```
4. Reload the gallery page (hard refresh with Ctrl+F5)

### Images Not Saving in Dashboard
1. Check browser console for errors
2. Verify Supabase connection
3. Check database permissions/RLS policies
4. Images fall back to localStorage as backup

### Performance
- Base64 data URLs can be large - consider optimization for production
- Images are loaded on every gallery page load
- Consider CDN storage for production deployments

## Current Status
✅ Feature Complete
- Header and profile images fully functional
- Images display with type badges
- All gallery features work with header/profile images
- Share, select, download all functional

## Next Steps (Optional)
- Add image resizing/optimization
- Add compression before storage
- Implement CDN storage
- Add image cropping/editing tools in dashboard
