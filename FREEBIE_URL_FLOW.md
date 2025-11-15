# Where Admin Gets Freebie Event URLs Back

## The Complete Flow: URL Journey

### **Step 1: Admin Clicks "Create Freebie Event" Button**

**Location:** `/admin/dashboard`

Admin fills form and clicks button:
```
Host Name:     [Sarah]
Host Email:    [sarah@example.com]
Event Name:    [Wedding]
Event Date:    [June 15, 2024]

[Create Freebie Event] ← Button clicked
```

---

### **Step 2: Frontend Calls API with Form Data**

**File:** `src/app/admin/dashboard/page.tsx` (lines 134-161)

```typescript
const handleCreateFreebieEvent = async () => {
  // Validate form fields
  if (!freebieHostName.trim()) { ... }
  if (!freebieHostEmail.trim()) { ... }
  if (!freebieEventName.trim()) { ... }
  if (!freebieEventDate.trim()) { ... }

  setIsCreatingFreebieEvent(true);
  
  try {
    // MAKE API CALL ← HERE
    const res = await fetch('/api/admin/create-freebie-event-for-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostName: freebieHostName,           // "Sarah"
        hostEmail: freebieHostEmail,         // "sarah@example.com"
        eventName: freebieEventName,         // "Wedding"
        eventDate: freebieEventDate,         // "June 15, 2024"
        adminAuthToken: adminEmail,          // Proof admin is logged in
      }),
    });

    const data = await res.json();  // ← RESPONSE COMES BACK HERE
```

---

### **Step 3: Backend Creates Event & Returns URLs**

**File:** `src/app/api/admin/create-freebie-event-for-customer/route.ts` (lines 145-167)

```typescript
// After event is successfully created in database...

return new Response(
  JSON.stringify({
    success: true,
    event: {
      id: newEvent.id,                    // "evt_1731702345820_a7f2x9"
      name: newEvent.name,                // "Wedding"
      slug: newEvent.slug,                // "wedding-celebration-1731702345820"
      ownerEmail: newEvent.owner_email,   // "sarah@example.com"
      ownerId: newEvent.owner_id,         // null (unclaimed)
      isFreebie: newEvent.is_freebie,     // true
      paymentType: newEvent.payment_type, // "freebie"
    },
    // ← URL DATA RETURNED HERE ← 
    urls: {
      hostDashboard: `https://snapworxx.com/dashboard/${newEvent.id}`,
      guestGallery: `https://snapworxx.com/e/${newEvent.slug}`,
    },
    message: `Freebie event created for ${hostName} (${hostEmail}). Share the guest gallery URL with attendees.`,
  }),
  { status: 201 }
);
```

**Response JSON:**
```json
{
  "success": true,
  "event": {
    "id": "evt_1731702345820_a7f2x9",
    "name": "Wedding",
    "slug": "wedding-celebration-1731702345820",
    "ownerEmail": "sarah@example.com",
    "ownerId": null,
    "isFreebie": true,
    "paymentType": "freebie"
  },
  "urls": {
    "hostDashboard": "https://snapworxx.com/dashboard/evt_1731702345820_a7f2x9",
    "guestGallery": "https://snapworxx.com/e/wedding-celebration-1731702345820"
  },
  "message": "Freebie event created for Sarah (sarah@example.com). Share the guest gallery URL with attendees."
}
```

---

### **Step 4: Frontend Receives URLs & Shows to Admin**

**File:** `src/app/admin/dashboard/page.tsx` (lines 162-177)

```typescript
    const data = await res.json();  // Receives the response above

    if (!res.ok || !data.success) {
      toast.error(data.error || 'Failed to create freebie event');
      return;
    }

    // ← URLS DISPLAYED TO ADMIN HERE ←
    toast.success(
      `✅ Freebie event created for ${freebieHostName}!\n\nHost Dashboard: ${data.urls.hostDashboard}\n\nGuest Gallery: ${data.urls.guestGallery}`
    );
    
    // Toast shows:
    // ✅ Freebie event created for Sarah!
    // 
    // Host Dashboard: https://snapworxx.com/dashboard/evt_1731702345820_a7f2x9
    // 
    // Guest Gallery: https://snapworxx.com/e/wedding-celebration-1731702345820

    // Clear form
    setFreebieHostName('');
    setFreebieHostEmail('');
    setFreebieEventName('');
    setFreebieEventDate('');
    
    // Reload data
    loadEvents();
    loadStats();
  } catch (err) {
    console.error('Error creating freebie event:', err);
    toast.error('Server error');
  } finally {
    setIsCreatingFreebieEvent(false);
  }
};
```

---

## Where Admin SEES the URLs

### **Location: Toast Notification**

After clicking "Create Freebie Event", admin sees a **success toast** at top of page:

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Freebie event created for Sarah!                         │
│                                                              │
│ Host Dashboard:                                             │
│ https://snapworxx.com/dashboard/evt_1731702345820_a7f2x9    │
│                                                              │
│ Guest Gallery:                                              │
│ https://snapworxx.com/e/wedding-celebration-1731702345820   │
└─────────────────────────────────────────────────────────────┘
```

---

## The Two URLs Explained

### **URL #1: Host Dashboard**
```
https://snapworxx.com/dashboard/evt_1731702345820_a7f2x9
```

**What it is:**
- Event dashboard where the HOST (Sarah) goes
- Admin should share this with Sarah in email (optional)

**What's on it:**
- View all uploaded photos
- Download all photos as ZIP
- Upload header/profile images
- Edit event details
- View event statistics
- See guest uploads in real-time (if Premium)

**Who uses it:**
- Sarah (the event host/customer)
- Only Sarah should have this link

---

### **URL #2: Guest Gallery**
```
https://snapworxx.com/e/wedding-celebration-1731702345820
```

**What it is:**
- Public gallery page guests see
- Can be shared widely without restriction

**What's on it:**
- View all photos uploaded by guests
- Upload new photos (if unlocked)
- Download photos (if allowed)
- View QR code
- Share gallery link

**Who uses it:**
- Wedding guests
- Anyone you give the link to
- No login needed
- Can be optional password protected

---

## How Admin Uses These URLs

### **Admin Workflow:**

1. **Admin creates freebie** in dashboard
2. **Admin sees both URLs** in success toast
3. **Admin copies the links** (manually)
4. **Admin sends email to customer** with:
   - Host Dashboard URL (Sarah's personal dashboard)
   - Guest Gallery URL (to share with guests)
   - Explanation of how to use
   - QR code (can be generated from dashboard)

### **Email Admin Should Send:**

```
TO: sarah@example.com
SUBJECT: Your Free SnapWorxx Event - Wedding

Hi Sarah,

Your free SnapWorxx event is ready! Here's what you need:

1. YOUR PERSONAL DASHBOARD (for you to manage):
   https://snapworxx.com/dashboard/evt_1731702345820_a7f2x9

2. GUEST GALLERY (share this with your guests):
   https://snapworxx.com/e/wedding-celebration-1731702345820

3. TO CLAIM YOUR EVENT:
   - Sign up at: https://snapworxx.com/signup
   - Use email: sarah@example.com
   - Your event will appear automatically!

Share the guest gallery link with your 50 wedding guests.
They can start uploading photos without any login!

Questions? Contact support@snapworxx.com

Thanks,
SnapWorxx Team
```

---

## Current Limitations

### **Admin Must Manually:**
- ✉️ Copy URLs from toast
- ✉️ Send email to customer
- ✉️ Share gallery link with guests
- ✉️ Provide instructions

### **Admin Workflow:**
1. Create freebie event
2. Read toast with URLs
3. Open email client
4. Compose email manually
5. Paste URLs
6. Send email

---

## Potential Improvements

### **Option 1: Copy Buttons**
Add "Copy" buttons to toast so admin can copy each URL with one click

### **Option 2: Auto Email**
System automatically sends branded email to customer with both URLs

### **Option 3: Email Template**
Show pre-written email template admin can copy and send

### **Option 4: QR Code Display**
Show QR code in dashboard so admin can screenshot/print

### **Option 5: All of Above**
- Auto email sent
- Copy buttons in toast
- QR code available
- Email template provided

---

## Summary

**Where Admin Gets URLs:**

| Item | Location | How | When |
|------|----------|-----|------|
| **URLs Generated** | Backend API | Combines event ID + slug | Event creation |
| **URLs Returned** | JSON response | API returns in response body | Immediately |
| **URLs Displayed** | Toast notification | Frontend shows success toast | Right after creation |
| **Admin Sees Them** | Top of page | Success toast with full URLs | After button click |
| **Admin Uses Them** | Manual copy/paste | Admin reads and copies URLs | Admin decision |
| **Customer Gets Them** | Admin sends email | Admin manually sends email | Admin action |

---

## Code References

**Frontend Handler:**
- File: `src/app/admin/dashboard/page.tsx`
- Lines: 134-177
- Function: `handleCreateFreebieEvent()`

**Backend API:**
- File: `src/app/api/admin/create-freebie-event-for-customer/route.ts`
- Lines: 145-167
- Returns: JSON with `urls` object

**URLs Contain:**
- `hostDashboard`: Uses event `id`
- `guestGallery`: Uses event `slug`
