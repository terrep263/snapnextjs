# Admin Events Not Showing - Troubleshooting Guide

## Issue
Events are not appearing in the Event Log section of the admin dashboard (`/admin/dashboard`).

---

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Navigate to `/admin/dashboard`
4. Look for these log messages:

### Expected Output (with events):
```
🔄 Loading events from API...
📦 Events API response: {...}
  Success: true
  Status: 200
  Data: { events: [...] }
✅ Loaded 5 events
  First event: { id: "...", name: "...", ... }
Events state updated: [...]
Events count: 5
```

### If No Events Exist:
```
🔄 Loading events from API...
📦 Events API response: {...}
  Success: true
  Status: 200
  Data: { events: [] }
✅ Loaded 0 events
  ⚠️  Events array is empty - no events in database
Events state updated: []
Events count: 0
```

### If Authentication Failed:
```
🔄 Loading events from API...
📦 Events API response: {...}
  Success: false
  Status: 401
❌ Failed to load events: Unauthorized - admin_session cookie not found
```

### If Database Error:
```
🔄 Loading events from API...
📦 Events API response: {...}
  Success: false
  Status: 500
❌ Failed to load events: Server error
```

---

## Step 2: Check Server Logs

Look at your server console (where `npm run dev` is running) for:

### Server-side logs:
```
🔍 Promo Events Request - Cookie Header: ✓ Present
  Cookies: admin_session, ...
  Admin Session: ✓ Found
📊 Fetched 5 events from database
✅ Returning 5 events with photo counts
```

### If No Events:
```
📊 Fetched 0 events from database
⚠️  No events found in database - returning empty array
```

### If Authentication Failed:
```
🔍 Promo Events Request - Cookie Header: ✗ Missing
❌ Unauthorized access to promo-events
```

---

## Step 3: Verify Events Exist in Database

Run the diagnostic script to check if events exist:

```bash
# Set environment variables first
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the diagnostic script
node check-events.mjs
```

### Expected Output (with events):
```
🔍 Checking events in database...

═══════════════════════════════════════════════════
📊 TOTAL EVENTS: 5
═══════════════════════════════════════════════════

First 10 events:

1. Steve's Birthday
   ID: evt_123
   Slug: steve-s-2025-birthday-qwf1e2
   Email: user@example.com
   Created: 2025-11-15T10:30:00Z
   Type: Freebie
...
```

### If No Events:
```
🔍 Checking events in database...

═══════════════════════════════════════════════════
📊 TOTAL EVENTS: 0
═══════════════════════════════════════════════════

⚠️  No events found in database
   This is why the admin dashboard shows an empty event log.
```

---

## Step 4: Solutions Based on Diagnosis

### Problem 1: No Events in Database
**Solution:** Create test events

```bash
# Option 1: Use the admin dashboard
1. Go to /admin/dashboard
2. Find "Create Freebie Event" section
3. Fill in the form and create an event

# Option 2: Create via API or Supabase SQL Editor
INSERT INTO events (id, name, slug, email, created_at)
VALUES (
  'test-event-' || extract(epoch from now())::text,
  'Test Event',
  'test-event-slug',
  'test@example.com',
  now()
);
```

### Problem 2: Authentication Failed
**Solution:** Re-login to admin panel

```bash
1. Go to /admin/login
2. Enter your admin credentials
3. After successful login, the admin_session cookie will be set
4. Navigate back to /admin/dashboard
```

### Problem 3: Database Connection Issues
**Solution:** Verify Supabase credentials

Check your environment variables:
```bash
# In .env.local or your deployment environment
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Verify the connection:
```bash
# Test database connection
curl "https://your-project.supabase.co/rest/v1/events" \
  -H "apikey: your-anon-key"
```

### Problem 4: API Response Format Mismatch
**Solution:** Already fixed in latest commit

The API now returns standardized response:
```json
{
  "success": true,
  "data": {
    "events": [...]
  }
}
```

---

## Step 5: Clear Cache and Restart

If issues persist:

1. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear cookies and cache
   - Restart browser

2. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   # Clear Next.js cache
   rm -rf .next

   # Restart
   npm run dev
   ```

3. **Re-login to admin:**
   - Go to `/admin/login`
   - Login again to refresh session

---

## Step 6: Check Database Schema

Verify the events table has all required columns:

```sql
-- Run this in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events';
```

Required columns:
- `id` (text)
- `name` (text)
- `email` (text)
- `slug` (text)
- `created_at` (timestamptz)
- `is_free` (boolean) - optional
- `is_freebie` (boolean) - optional
- `payment_type` (text) - optional
- `stripe_session_id` (text) - optional
- `promo_type` (text) - optional
- `owner_email` (text) - optional

---

## Quick Diagnostic Checklist

- [ ] Logged into admin panel (`/admin/login`)
- [ ] Browser console shows no errors
- [ ] Server console shows successful event fetch
- [ ] Events exist in Supabase `events` table
- [ ] Supabase credentials are correct
- [ ] `admin_session` cookie is present
- [ ] API returns `success: true`
- [ ] No CORS errors in console
- [ ] Database connection is working
- [ ] All required table columns exist

---

## Still Having Issues?

1. **Check Network Tab:**
   - Open DevTools → Network tab
   - Navigate to `/admin/dashboard`
   - Find the request to `/api/admin/promo-events`
   - Click on it and check:
     - Request headers (cookie present?)
     - Response status (200?)
     - Response body (events present?)

2. **Enable Verbose Logging:**
   All debugging is already enabled in the latest code. Check both:
   - Browser console (client-side logs)
   - Server console (server-side logs)

3. **Test Direct API Call:**
   ```bash
   # Get your admin_session cookie from browser DevTools
   curl "http://localhost:3000/api/admin/promo-events" \
     -H "Cookie: admin_session=your-session-token"
   ```

---

## Recent Code Changes

The following improvements were made to help diagnose this issue:

1. **API Response Standardization** (`/api/admin/promo-events/route.ts`):
   - Returns consistent format: `{ success: true, data: { events: [...] } }`
   - Added comprehensive server-side logging
   - Explicit handling of empty events array

2. **Client-Side Debugging** (`/app/admin/dashboard/page.tsx`):
   - Enhanced console logging
   - Shows response structure clearly
   - Identifies empty array vs error states

3. **Diagnostic Tools**:
   - `check-events.mjs` - Verify events in database
   - `ADMIN_EVENTS_TROUBLESHOOTING.md` - This guide

---

## Next Steps

1. Follow Step 1-3 above to identify the root cause
2. Apply the appropriate solution from Step 4
3. If still stuck, share the console logs (browser + server) for further assistance

---

**Last Updated:** November 18, 2025
