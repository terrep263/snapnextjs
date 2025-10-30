# Supabase Database Setup

This directory contains the database schema and storage configuration for SnapWorxx.

## Quick Setup

### 1. Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Fill in project details and wait for setup to complete
4. Note your project URL and API keys

### 2. Run the Schema SQL

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy the contents of `schema.sql` and paste it
4. Click "Run" to execute
5. Verify tables were created in **Table Editor**

### 3. Set Up Storage

1. In your Supabase dashboard, go to **SQL Editor** again
2. Create a new query
3. Copy the contents of `storage.sql` and paste it
4. Click "Run" to execute
5. Go to **Storage** in the sidebar to verify the `event-photos` bucket was created

### 4. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Get these from your Supabase project settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Database Schema

### Tables

#### `events`
Stores event information including name, slug, payment status, and expiration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Event name (e.g., "Sarah's Birthday") |
| `slug` | TEXT | URL-friendly unique identifier |
| `email` | TEXT | Event organizer email |
| `stripe_session_id` | TEXT | Stripe checkout session ID |
| `stripe_payment_status` | TEXT | Payment status: pending, completed, failed |
| `is_active` | BOOLEAN | Whether event is currently active |
| `created_at` | TIMESTAMPTZ | Event creation timestamp |
| `expires_at` | TIMESTAMPTZ | Event expiration (30 days default) |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `photos`
Stores metadata for uploaded photos.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | Foreign key to events table |
| `file_name` | TEXT | Original filename |
| `file_path` | TEXT | Full file path |
| `file_size` | INTEGER | File size in bytes |
| `mime_type` | TEXT | Image MIME type |
| `storage_path` | TEXT | Path in Supabase storage |
| `uploaded_at` | TIMESTAMPTZ | Upload timestamp |
| `uploader_ip` | TEXT | Uploader IP address (optional) |

### Storage

#### `event-photos` Bucket
- **Public**: Yes (files accessible via public URL)
- **File Size Limit**: 50MB per file
- **Allowed MIME Types**: image/jpeg, image/jpg, image/png, image/gif, image/webp, image/heic, image/heif
- **File Organization**: `event-photos/[event-slug]/[filename]`

Example path: `event-photos/johns-birthday-2024/photo-uuid-123.jpg`

Public URL format:
```
https://[project-ref].supabase.co/storage/v1/object/public/event-photos/[event-slug]/[filename]
```

## Security

### Row Level Security (RLS)

Both tables have RLS enabled with the following policies:

**Events:**
- ✅ Public read access (anyone can view events)
- ✅ Service role can insert/update (API routes only)

**Photos:**
- ✅ Public read access (anyone can view photos)
- ✅ Public insert access (anyone can upload)
- ✅ Service role can delete (controlled deletion only)

**Storage:**
- ✅ Public read access (view/download photos)
- ✅ Public upload access (with folder requirement)
- ✅ Service role only for deletion

## Helper Functions

### `deactivate_expired_events()`
Deactivates events that have passed their expiration date.

**Usage:**
```sql
SELECT deactivate_expired_events();
```

**Recommended:** Set up a cron job to run this daily:
1. Go to **Database** > **Cron Jobs** in Supabase
2. Create new job:
   - Name: "Deactivate expired events"
   - Schedule: `0 0 * * *` (daily at midnight)
   - SQL: `SELECT deactivate_expired_events();`

### `get_event_stats(event_uuid)`
Returns statistics for a given event.

**Usage:**
```sql
SELECT * FROM get_event_stats('event-uuid-here');
```

**Returns:**
- `photo_count`: Number of photos uploaded
- `total_size`: Total size of all photos in bytes
- `days_remaining`: Days until event expires

## Testing the Setup

### Test Database Connection

```typescript
// In a Next.js API route or component
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('events')
  .select('*')
  .limit(1);

console.log('Connection test:', data ? 'Success' : 'Failed', error);
```

### Test Storage Upload

```typescript
import { supabase } from '@/lib/supabase';

// Upload a test file
const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('event-photos')
  .upload('test-event/test.jpg', file);

console.log('Upload test:', data ? 'Success' : 'Failed', error);
```

## Maintenance

### Regular Tasks

1. **Daily**: Run `deactivate_expired_events()` to clean up expired events
2. **Weekly**: Review storage usage in Supabase dashboard
3. **Monthly**: Check for orphaned photos (photos without events)

### Cleanup Orphaned Photos

```sql
-- Find photos for deleted events
SELECT p.* FROM photos p
LEFT JOIN events e ON p.event_id = e.id
WHERE e.id IS NULL;

-- Delete them (run carefully!)
DELETE FROM photos p
WHERE NOT EXISTS (
    SELECT 1 FROM events e WHERE e.id = p.event_id
);
```

## Migration and Rollback

### To Roll Back

If you need to remove everything:

```sql
-- Drop tables (this will also delete all data!)
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP FUNCTION IF EXISTS deactivate_expired_events() CASCADE;
DROP FUNCTION IF EXISTS get_event_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Delete storage bucket (do this in Storage UI or via SQL)
DELETE FROM storage.buckets WHERE id = 'event-photos';
```

## Troubleshooting

### Issue: "permission denied for table events"
**Solution**: Make sure RLS policies are properly created. Run the schema.sql again.

### Issue: "Failed to upload file to storage"
**Solution**:
1. Check that the bucket exists in Storage UI
2. Verify storage policies are created
3. Check file size is under 50MB
4. Verify MIME type is in allowed list

### Issue: "relation 'events' does not exist"
**Solution**: Run schema.sql in the SQL Editor to create tables.

## Support

For issues with Supabase setup:
1. Check [Supabase Documentation](https://supabase.com/docs)
2. Review [Supabase Discord](https://discord.supabase.com)
3. Check application logs for specific errors
