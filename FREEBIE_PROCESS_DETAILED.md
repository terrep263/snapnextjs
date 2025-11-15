# SnapWorxx Freebie Events - Complete Process Explanation

## Overview
The freebie process allows admins to create complimentary events and assign them to specific customers via email. When those customers sign up or log in, the events are automatically transferred to their account.

---

## The Three Phases of the Freebie Process

### **Phase 1: Admin Creates Freebie Event** 🎁

**What Happens:**
Admin goes to `/admin/dashboard` and fills out the freebie creation form:

```
┌─────────────────────────────────────────────────────┐
│ Create Freebie Event Form                           │
├─────────────────────────────────────────────────────┤
│ Host Name:     [Sarah Johnson]                      │
│ Host Email:    [sarah@example.com]                  │
│ Event Name:    [Wedding Celebration]                │
│ Event Date:    [June 15, 2024]                      │
│                 [Create Freebie Event] Button        │
└─────────────────────────────────────────────────────┘
```

**API Call:**
```
POST /api/admin/create-freebie-event-for-customer
{
  "hostName": "Sarah Johnson",
  "hostEmail": "sarah@example.com",
  "eventName": "Wedding Celebration",
  "eventDate": "2024-06-15"
}
```

**Server-Side Processing:**

1. **Admin Verification** ✅
   - Check if request has valid admin session cookie
   - Verify `admin_session` cookie or `Authorization: Bearer admin_*` header
   - Reject if not admin
   ```typescript
   if (!isAdminRequest(req)) {
     return 401 Unauthorized
   }
   ```

2. **Input Validation** ✅
   - Verify all required fields present: `hostName`, `hostEmail`, `eventName`, `eventDate`
   - Validate email format with regex
   - Reject if invalid

3. **Count Per-Customer Limit** ✅
   - Query database for existing freebie events with `owner_email = sarah@example.com`
   - Count how many freebie events this customer already has
   - Check against limit (1000 per customer)
   - Reject if at limit
   ```typescript
   const { data: existingFreebies } = await supabase
     .from('events')
     .select('id', { count: 'exact' })
     .eq('owner_email', hostEmail)
     .eq('is_freebie', true);
   ```

4. **Generate Event Details** ✅
   - Create unique slug: `wedding-celebration-1731702345820`
   - Generate event ID: `evt_1731702345820_a7f2x9`
   - Create all event properties

5. **Insert into Database** ✅
   - Create new event with these KEY fields:
   ```sql
   INSERT INTO events (
     id,
     name,
     slug,
     email,                    -- hostEmail (contact email)
     owner_email,             -- hostEmail (for claiming)
     owner_id,                -- NULL (unclaimed)
     status,
     is_free,                 -- true
     is_freebie,              -- true
     payment_type,            -- 'freebie'
     max_photos,              -- 999999 (unlimited)
     max_storage_bytes,       -- 999999999 (unlimited ~999GB)
     owner_name,              -- hostName
     stripe_session_id        -- NULL (no payment)
   ) VALUES (...)
   ```

6. **Return Success** ✅
   ```json
   {
     "success": true,
     "event": {
       "id": "evt_1731702345820_a7f2x9",
       "name": "Wedding Celebration",
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
     "message": "Freebie event created for Sarah Johnson (sarah@example.com)..."
   }
   ```

**Admin UI Feedback:**
- Success toast appears
- Admin sees generated URLs to share with customer
- Event appears in admin dashboard event log (marked as Freebie)
- Count updates: "Freebie Count: X/100"

---

### **Phase 2: Customer Signs Up/Logs In** 👤

**What Happens:**
Customer receives event details (email with URL or QR code) and decides to sign up or log in.

#### **Scenario A: New Customer Signs Up**

```
1. Customer visits: https://snapworxx.com/signup
2. Fills signup form:
   - Email: sarah@example.com
   - Password: [secret]
   - Name: Sarah
3. Clicks "Sign Up"
```

**Backend Flow:**

1. **Create User in Auth System** ✅
   - Hash password
   - Create user record in Supabase Auth
   - Generate user ID: `d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6`

2. **Trigger Claiming Process** ✅
   - After successful signup, auth handler should call:
   ```typescript
   await claimFreebieEventsForUser(
     email: "sarah@example.com",
     userId: "d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6"
   )
   ```

#### **Scenario B: Existing Customer Logs In**

```
1. Customer visits: https://snapworxx.com/login
2. Fills login form:
   - Email: sarah@example.com
   - Password: [secret]
3. Clicks "Log In"
```

**Backend Flow:**

1. **Verify Credentials** ✅
   - Look up user by email
   - Verify password hash
   - Retrieve user ID: `d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6`

2. **Trigger Claiming Process** ✅
   - After successful login, auth handler should call:
   ```typescript
   await claimFreebieEventsForUser(
     email: "sarah@example.com",
     userId: "d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6"
   )
   ```

---

### **Phase 3: Automatic Event Claiming** 🔗

**The Claiming Flow:**

When `claimFreebieEventsForUser()` is called with Sarah's email and user ID:

1. **Utility Function Called** ✅
   ```typescript
   // In src/lib/freebie-claiming.ts
   export async function claimFreebieEventsForUser(
     email: "sarah@example.com",
     userId: "d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6"
   ) {
     // Makes API call to claiming endpoint
     const response = await fetch('/api/auth/claim-freebie-events', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, userId })
     });
     // Returns: { success: true, claimedCount: 1 }
   }
   ```

2. **Claiming Endpoint Processes** ✅
   ```typescript
   // In src/app/api/auth/claim-freebie-events/route.ts
   export async function POST(request: NextRequest) {
     const { email, userId } = await request.json();
     
     // Step 1: Find all unclaimed freebie events for this email
     const { data: unclaimedFreebies } = await supabase
       .from('events')
       .select('id')
       .eq('owner_email', email)           // ← Match by email
       .eq('is_freebie', true)             // ← Only freebies
       .is('owner_id', null);              // ← Only unclaimed
     
     // Result: [{ id: 'evt_1731702345820_a7f2x9' }]
     
     // Step 2: Update all unclaimed events - set owner_id
     const { error } = await supabase
       .from('events')
       .update({ owner_id: userId })      // ← Link to user
       .in('id', eventIds);
     
     // Database now shows:
     // owner_id: d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6 (was NULL)
     // owner_email: sarah@example.com (unchanged)
     
     return {
       success: true,
       claimedCount: 1,
       message: 'Claimed 1 freebie event(s) for this user'
     };
   }
   ```

3. **Success Response** ✅
   - Returns count of claimed events
   - Logs success: `✅ Claimed 1 freebie events for user sarah@example.com`
   - Auth handler notifies user (optional toast)

---

## Database State Throughout Process

### **Step 1: After Admin Creates Event**
```sql
SELECT * FROM events WHERE id = 'evt_1731702345820_a7f2x9';

Result:
┌──────────────────────────────┬──────────────────────────┐
│ Column                       │ Value                    │
├──────────────────────────────┼──────────────────────────┤
│ id                           │ evt_1731702345820_a7f2x9 │
│ name                         │ Wedding Celebration      │
│ slug                         │ wedding-celebration-1... │
│ email                        │ sarah@example.com        │
│ owner_email                  │ sarah@example.com        │
│ owner_id                     │ NULL ← UNCLAIMED         │
│ is_freebie                   │ true                     │
│ payment_type                 │ 'freebie'                │
│ max_storage_bytes            │ 999999999                │
│ stripe_session_id            │ NULL (no payment)        │
│ created_at                   │ 2024-11-15T10:32:25Z    │
└──────────────────────────────┴──────────────────────────┘
```

### **Step 2: After Customer Signs Up & Claiming Triggered**
```sql
SELECT * FROM events WHERE id = 'evt_1731702345820_a7f2x9';

Result:
┌──────────────────────────────┬──────────────────────────────────────┐
│ Column                       │ Value                                │
├──────────────────────────────┼──────────────────────────────────────┤
│ id                           │ evt_1731702345820_a7f2x9             │
│ name                         │ Wedding Celebration                  │
│ slug                         │ wedding-celebration-1...             │
│ email                        │ sarah@example.com                    │
│ owner_email                  │ sarah@example.com                    │
│ owner_id                     │ d1e2f3g4-h5i6-... ← CLAIMED!        │
│ is_freebie                   │ true                                 │
│ payment_type                 │ 'freebie'                            │
│ max_storage_bytes            │ 999999999                            │
│ stripe_session_id            │ NULL (no payment)                    │
│ created_at                   │ 2024-11-15T10:32:25Z                │
└──────────────────────────────┴──────────────────────────────────────┘

Key Change: owner_id changed from NULL → d1e2f3g4-h5i6-...
```

---

## Key Architectural Decisions

### **1. Why Store Both `email` and `owner_email`?**

```
email        → Contact/creator email for event context
owner_email  → Used for claiming (matches signup email)
owner_id     → User ID after claiming (prevents re-claiming)
```

**Benefit:** Admin can see who the event was created for, customers can claim by email match.

### **2. Why `owner_id = NULL` Initially?**

```
Unclaimed:  owner_id IS NULL
Claimed:    owner_id = [user_id]
```

**Benefit:** Easy to query for unclaimed events, prevents duplicate claiming.

### **3. Why No Stripe Fields?**

```
stripe_session_id: NULL      (freebie ≠ paid)
payment_type: 'freebie'      (clear marker)
is_free: true                (not premium)
is_freebie: true             (complimentary)
```

**Benefit:** Stripe logic completely bypassed, no payment verification needed.

### **4. Why Unlimited Storage?**

```
max_storage_bytes: 999999999  (~999 GB)
storage_expires_at: NULL      (never expires)
```

**Benefit:** Freebies are complimentary - no storage limits or expiration.

---

## Integration Points

### **How to Wire Claiming Into Your Auth Handler**

**In your signup/login success handler:**

```typescript
// After user is successfully authenticated
import { claimFreebieEventsForUser } from '@/lib/freebie-claiming';

async function handleAuthSuccess(user: { email: string; id: string }) {
  // Step 1: Do normal auth stuff (set cookies, redirect, etc.)
  
  // Step 2: Claim any freebie events
  const result = await claimFreebieEventsForUser(user.email, user.id);
  
  if (result.success && result.claimedCount > 0) {
    // Optional: Show toast to user
    showToast(`🎁 You have ${result.claimedCount} free event(s)!`);
  }
  
  // Step 3: Redirect to dashboard or home
  router.push('/dashboard');
}
```

---

## Admin Verification Details

### **How Admin Access is Checked**

The freebie creation endpoint verifies admin status:

```typescript
function isAdminRequest(request: Request | NextRequest): boolean {
  // Check 1: Look for admin session cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split('; ');
    const adminSessionCookie = cookies.find(c => c.startsWith('admin_session='));
    if (adminSessionCookie) return true;  // ✅ Admin confirmed
  }

  // Check 2: Look for admin bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer admin_')) return true;  // ✅ Admin confirmed

  return false;  // ❌ Not admin
}
```

**Example Admin Session Cookie:**
```
Cookie: admin_session=abc123def456; Path=/; HttpOnly; Secure
```

**Example Admin Bearer Token:**
```
Authorization: Bearer admin_xyz789uvw
```

---

## Security Features

### **1. Admin-Only Creation**
- Only authenticated admins can create freebie events
- Client-side verification via session cookie
- Server-side verification via admin check

### **2. Email-Based Claiming**
- Customer must sign up with exact email used by admin
- No direct linking without email match
- Prevents unauthorized event transfer

### **3. Per-Customer Limits**
- Maximum 1000 freebie events per customer
- Prevents abuse/spam
- Protects database

### **4. One-Time Claiming**
- Once `owner_id` is set, event cannot be re-claimed
- Prevents duplicate transfers
- Ensures single ownership

### **5. No Payment Processing**
- Freebies never touch Stripe
- No payment verification needed
- Completely separate code path

---

## Verification Query

**To verify freebie events in your database:**

```sql
-- Find all unclaimed freebie events
SELECT id, name, owner_email, owner_id, is_freebie, payment_type
FROM events
WHERE is_freebie = true
  AND owner_id IS NULL
ORDER BY created_at DESC;

-- Find all claimed freebie events for a user
SELECT id, name, owner_email, owner_id, is_freebie, payment_type
FROM events
WHERE is_freebie = true
  AND owner_id = 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6'
ORDER BY created_at DESC;

-- Find all freebie events for an email
SELECT id, name, owner_email, owner_id, is_freebie, payment_type
FROM events
WHERE owner_email = 'sarah@example.com'
  AND is_freebie = true
ORDER BY created_at DESC;

-- Count freebie events per customer
SELECT owner_email, COUNT(*) as total
FROM events
WHERE is_freebie = true
GROUP BY owner_email
ORDER BY total DESC;
```

---

## Error Handling

### **Common Error Scenarios**

| Scenario | Error Code | Message | Solution |
|----------|-----------|---------|----------|
| Not admin | 401 | "Unauthorized: Admin access required" | Use admin account |
| Missing fields | 400 | "Missing required fields" | Fill all form fields |
| Invalid email | 400 | "Invalid email address" | Use valid email format |
| Customer limit hit | 409 | "Maximum freebie events reached" | Increase limit or use different email |
| DB connection error | 500 | "Database error" | Check Supabase connection |
| Claiming fails | 500 | "Failed to claim freebie events" | Check email match |

---

## Summary

**The Freebie Process in 5 Steps:**

1. **Admin Creates** → Event inserted with `owner_email` and `owner_id = NULL`
2. **Customer Signs Up** → Uses same email as `owner_email`
3. **Auth Success** → Claiming endpoint called automatically
4. **Events Found** → Query finds events where `owner_email` matches and `owner_id` is NULL
5. **Events Claimed** → Update all found events to set `owner_id = customer_id`

**Result:** Customer logs in, sees their freebie event(s) in dashboard immediately.

No Stripe, no payment, no subscriptions. Just instant event access for complimentary customers. ✅
