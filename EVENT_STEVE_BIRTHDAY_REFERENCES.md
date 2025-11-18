# Event Reference Report: steve-s-2025-birthday-qwf1e2

**Event URL:** https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2
**Event Slug:** `steve-s-2025-birthday-qwf1e2`
**Event ID Suffix:** `qwf1e2`

---

## 📋 Summary

This event is referenced in **11 documentation/test files** across the codebase. The event URL pattern is also dynamically generated in **5 source code files**.

---

## 🔍 Direct References in Documentation

### Test & Documentation Files (11 files)

1. **BUILD_FIX_NOV10.md** (line 27)
   - Context: Build fix documentation

2. **DEPLOYMENT_NOV10_2025.md** (line 99)
   - Context: Deployment documentation

3. **DOWNLOAD_ALL_FIX.md** (line 56)
   - Context: Download functionality testing
   - Reference: `Test on: https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2`

4. **DOWNLOAD_FINAL_SUMMARY.md** (lines 4, 236)
   - Context: Download system summary
   - Reference: `**Event:** https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2`

5. **DOWNLOAD_SYSTEM_GUIDE.md** (line 129)
   - Context: Download system guide
   - Reference: `Test on: https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2`

6. **QUICK_REF_101_ITEMS.md** (line 114)
   - Context: Quick reference for 101+ items
   - Reference: `1. Go to: https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2`

7. **SITEMAP_EXAMPLE.xml** (line 35)
   - Context: SEO sitemap example
   - XML: `<loc>https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2</loc>`

8. **TEST_101_ITEMS.md** (lines 3, 91)
   - Context: Testing with 101+ items
   - References:
     - `**Event:** https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2`
     - `1. Open: https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2`

9. **TEST_DOWNLOAD_SYSTEM.md** (lines 13, 40)
   - Context: Download system testing
   - References:
     - `1. Open https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2`

---

## 💻 Dynamic URL Generation in Source Code

These files generate event URLs dynamically using the pattern `https://snapworxx.com/e/{slug}`:

### 1. **src/lib/externalUpload.ts** (line 16)
```typescript
const eventUrl = `https://snapworxx.com/e/${eventId}`;
```
- Purpose: External upload functionality

### 2. **src/app/api/qr/route.ts** (lines 15, 105)
```typescript
// Example: /api/qr?t=https://snapworxx.com/e/event-slug&logo=true
// "url": "https://snapworxx.com/e/event-slug"
```
- Purpose: QR code generation for events

### 3. **src/app/api/admin/create-freebie-event-for-customer/route.ts** (lines 301, 341, 347)
```typescript
const galleryUrl = `https://snapworxx.com/e/${newEvent.slug}`;
// ...
guestGallery: `https://snapworxx.com/e/${newEvent.slug}`,
// ...
`⚠️ Freebie event created, but email failed to send.
You can manually send the guest gallery link:
https://snapworxx.com/e/${newEvent.slug}`
```
- Purpose: Freebie event creation and email notifications

---

## 🗃️ Database Query

To check if this event exists in the database and get all its information, I've created:

**📄 QUERY_EVENT_SQL.sql** - SQL queries you can run in Supabase SQL Editor

The queries will retrieve:
- ✅ Event details (name, status, dates, etc.)
- ✅ All photos associated with the event
- ✅ Photo count and total size
- ✅ Photo type breakdown
- ✅ Upload timeline

---

## 🎯 Event Purpose

Based on the references, this event appears to be used as:

1. **Test Event** - For testing download functionality with 101+ items
2. **Documentation Example** - Referenced in multiple guides
3. **SEO Example** - Included in sitemap examples
4. **Build Testing** - Used to verify deployments

---

## 📊 Next Steps

### To View Event in Production:
Visit: https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2

### To Query Event in Database:
1. Open Supabase SQL Editor
2. Run queries from `QUERY_EVENT_SQL.sql`
3. This will show:
   - Event metadata
   - All photos
   - Storage details
   - Upload statistics

### To Find Event Data Programmatically:
```typescript
// Using Supabase client
const { data: event } = await supabase
  .from('events')
  .select('*')
  .eq('slug', 'steve-s-2025-birthday-qwf1e2')
  .single();

const { data: photos } = await supabase
  .from('photos')
  .select('*')
  .eq('event_id', event.id);
```

---

## 🔗 Related URLs

- **Guest Gallery:** `https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2`
- **QR Code API:** `/api/qr?t=https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2&logo=true`
- **Bulk Download:** Available via event gallery page

---

**Generated:** November 18, 2025
