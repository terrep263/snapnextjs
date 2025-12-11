# Sprint 2: Quick Start Guide

## 🚀 Quick Deployment (5 minutes)

### Step 1: Run Database Migration
```sql
-- Copy migrations/sprint2_gallery_schema.sql into Supabase SQL Editor
-- Click "Run" to execute
```

### Step 2: Verify Migration
```sql
-- Quick check that tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('photo_views', 'photo_tags');
```

### Step 3: Use Enhanced Gallery
```tsx
// In your event page component
import EnhancedGallery from '@/components/EnhancedGallery';

<EnhancedGallery
  eventId={eventData.id}
  eventName={eventData.name}
/>
```

### Step 4: Test Gallery API
```bash
# Test gallery endpoint
curl "http://localhost:3000/api/events/evt_123/gallery?page=1&limit=50"

# Test search
curl "http://localhost:3000/api/events/evt_123/gallery?search=beach"
```

## ✅ Verification Checklist

- [ ] Database migration executed successfully
- [ ] photo_views table exists
- [ ] photo_tags table exists
- [ ] Photos table has new columns
- [ ] Gallery API returns photos
- [ ] EnhancedGallery component renders
- [ ] Search functionality works
- [ ] Infinite scroll works

## 🔍 Quick Debugging

### Check if tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('photo_views', 'photo_tags');
```

### Check photos table columns:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'photos' 
AND column_name IN ('is_approved', 'uploaded_at', 'user_id');
```

### Test gallery API:
```bash
# Get first page
curl "http://localhost:3000/api/events/YOUR_EVENT_ID/gallery?page=1&limit=10"

# Search
curl "http://localhost:3000/api/events/YOUR_EVENT_ID/gallery?search=test"
```

## 📞 Support

If issues occur:
1. Check `SPRINT2_IMPLEMENTATION.md` for detailed docs
2. Verify database migration completed
3. Check browser console for errors
4. Verify API endpoints are accessible
5. Test with a small number of photos first



