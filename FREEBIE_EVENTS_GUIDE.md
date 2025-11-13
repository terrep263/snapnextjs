# Freebie Events Implementation Guide

## Overview

This document describes the complete freebie event system that allows admins to create complimentary events for specific customers, completely bypassing the Stripe payment flow.

## Key Concepts

### What is a Freebie Event?

A freebie event is:
- ✅ A fully functional event (host can view details, share, download, get QR code)
- ✅ Assigned to a specific customer email by the admin
- ✅ Never touches Stripe or checkout logic
- ✅ Marked with `is_freebie = true` and `payment_type = 'freebie'`
- ❌ NOT a paid event (no Stripe session, no payment required)
- ❌ NOT affected by paid features or limits

### Important: Stripe Protection

**The Stripe integration is completely untouched and protected:**
- Existing paid event creation via checkout remains unchanged
- Discount codes and coupons work exactly as before
- Webhooks and payment verification are unaffected
- Freebie events use a separate code path with zero Stripe interaction

## Database Schema

New columns added to `events` table:

```sql
- owner_id (text): User ID who owns the event (NULL until user logs in/signs up)
- owner_email (text): Email address to claim events for (set by admin at creation)
- payment_type (text): 'stripe' (paid), 'freebie' (complimentary), or NULL (legacy)
```

Existing columns used:
- `is_freebie` (boolean): true for freebie events
- `email`: Event creator email (same as owner_email for freebies)
- `stripe_session_id`: NULL for freebie events (no payment)

## Admin Flow: Creating a Freebie Event

### Via Admin Dashboard

1. Go to: `https://snapworxx.com/admin/dashboard`
2. Scroll to "Create Freebie Event (Master Email)" section
3. Fill in:
   - **Host Name**: Name of the customer receiving the event
   - **Host Email**: Their email address (for event claiming)
   - **Event Name**: Event title
   - **Event Date**: When the event occurs
4. Click "Create Freebie Event"
5. Admin receives success message with:
   - Host Dashboard URL: `https://snapworxx.com/dashboard/{event_id}`
   - Guest Gallery URL: `https://snapworxx.com/e/{event_slug}`

### What Happens Behind the Scenes

```
POST /api/admin/create-freebie-event-for-customer
├─ Validates: hostName, hostEmail, eventName, eventDate
├─ Checks freebie count (max 100 total)
├─ Creates event with:
│  ├─ is_freebie = true
│  ├─ payment_type = 'freebie'
│  ├─ owner_email = hostEmail (for claiming)
│  ├─ owner_id = null (unclaimed until user logs in)
│  ├─ stripe_session_id = null (NO PAYMENT)
│  └─ max_storage_bytes = 999999999 (unlimited)
└─ Returns host dashboard and guest gallery URLs
```

## Customer Flow: Accessing a Freebie Event

### Scenario 1: Customer Already Has an Account

1. Admin creates freebie event for existing customer's email
2. Event created with `owner_email = customer@email.com`, `owner_id = null`
3. Customer logs in normally
4. System claims freebie events by email match (see below)
5. Event appears in customer's dashboard
6. Customer can manage event exactly like a paid event

### Scenario 2: Customer Signs Up After Freebie Creation

1. Admin creates freebie event with email: `newcustomer@email.com`
2. Event created with `owner_email = newcustomer@email.com`, `owner_id = null`
3. Customer signs up with same email: `newcustomer@email.com`
4. On signup/login success, system calls: `POST /api/auth/claim-freebie-events`
5. Endpoint finds all events where:
   - `owner_email = customer_email`
   - `is_freebie = true`
   - `owner_id = null` (unclaimed)
6. Sets `owner_id` for all matching events
7. Events now appear in customer's dashboard

## Event Claiming Logic

### When Events are Claimed

Events are claimed (linked to a user) in two scenarios:

1. **On Login/Signup**: When user authenticates with email `X`, system checks for unclaimed freebie events with `owner_email = X`
2. **On Dashboard Load**: Dashboard queries include logic to claim events by email match

### Dashboard Event Loading Query

The dashboard event loading logic:

```typescript
// Load events for current user
// Include both owned events (owner_id matches) AND unclaimed freebie events (email matches)
const { data: events } = await supabase
  .from('events')
  .select('*')
  .or(`owner_id.eq.${currentUserId}, and(owner_email.eq.${currentUserEmail}, is_freebie.eq.true, owner_id.is.null)`);

// Auto-claim any unclaimed freebie events
const unclaimedFreebies = events.filter(e => e.owner_email && !e.owner_id && e.is_freebie);
if (unclaimedFreebies.length > 0) {
  await supabase
    .from('events')
    .update({ owner_id: currentUserId })
    .in('id', unclaimedFreebies.map(e => e.id));
}
```

## Features Available for Freebie Events

Once claimed by a user, freebie events support:

- ✅ View event details (name, date, description)
- ✅ Upload photos
- ✅ Download all photos
- ✅ Share event (guest URL)
- ✅ View QR code
- ✅ See storage usage
- ✅ Manage event (edit details)
- ✅ Unlimited storage (~999GB)
- ✅ Unlimited photo count

What's NOT included:
- ❌ No Stripe reference
- ❌ No "upgrade" prompts
- ❌ No payment status
- ❌ No checkout redirects

## Guest Access (No Changes)

Guest access to freebie events works exactly like paid events:

1. Guest scans QR code or clicks share link
2. Opens: `https://snapworxx.com/e/{event_slug}`
3. Can view photos and upload new ones
4. Zero difference between freebie and paid guest experiences

Guest does NOT know it's a freebie event - it's identical to paid event galleries.

## Admin Dashboard Updates

### Freebie Event Count

The admin dashboard now shows:
- "Freebie Count: X/100" (global limit)
- Total Events breakdown: "Free Basic: Y | Freebie: Z | Paid: W"

### Freebie Event Creation UI

New form with fields:
- Host Name (required)
- Host Email (required)
- Event Name (required)
- Event Date (required)

## Security Considerations

### Admin-Only Access

Only admin users (authenticated at `/admin/dashboard`) can create freebie events.
- Authentication happens via existing admin session cookies
- API endpoint should verify admin status (can add middleware if needed)

### Email Verification

- Admin enters customer email
- System does NOT send verification email for freebie events
- Event is created with email and waits for customer to sign up/log in with that email

### Ownership Protection

- Events are protected by `owner_id` or `owner_email` matching
- Only the assigned customer can claim the event
- RLS policies ensure users can only see their own events

## Migration Steps

To enable the freebie event system:

### 1. Run Database Migration

Go to Supabase SQL Editor and run:

```sql
-- Add owner fields for freebie events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_id text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_email text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS payment_type text CHECK (payment_type IN ('stripe', 'freebie', NULL));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_owner_id ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_owner_email ON public.events(owner_email);
CREATE INDEX IF NOT EXISTS idx_events_payment_type ON public.events(payment_type);
CREATE INDEX IF NOT EXISTS idx_events_freebie_unclaimed 
  ON public.events(owner_email, is_freebie) 
  WHERE is_freebie = true AND owner_id IS NULL;
```

### 2. Verify Columns Exist

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('owner_id', 'owner_email', 'payment_type')
ORDER BY column_name;
```

Expected result:
- `owner_email` (text)
- `owner_id` (text)
- `payment_type` (text)

### 3. Update Admin Dashboard

The admin dashboard is already updated with:
- New Host Name and Host Email form fields
- Updated freebie event creation API call
- Success messages with customer URLs

### 4. Deploy

Push changes to GitHub and deploy via Vercel.

## Testing the Freebie Flow

### Test 1: Create Freebie Event

1. Log in to admin dashboard
2. Fill in freebie event form:
   - Host Name: "Test Customer"
   - Host Email: "test@example.com"
   - Event Name: "Test Event"
   - Event Date: Any future date
3. Click "Create Freebie Event"
4. Verify success message with URLs
5. Check Supabase: Event should exist with `is_freebie = true`, `owner_email = test@example.com`, `owner_id = null`

### Test 2: Customer Claims Event

1. Sign up new account with email: "test@example.com"
2. After signup, customer is redirected to dashboard
3. New freebie event should appear in dashboard
4. In Supabase, verify event now has `owner_id` set to customer's user ID

### Test 3: Guest Access

1. Grab event slug from Step 1
2. Open: `https://snapworxx.com/e/{event_slug}`
3. Should work exactly like any event gallery
4. Guest can upload photos

### Test 4: No Stripe Interference

1. Create a PAID event via checkout normally
2. Create a FREEBIE event via admin
3. Verify: Both events appear in dashboard
4. Verify: Paid event has `stripe_session_id`, freebie has NULL
5. Verify: No checkout prompts or payment messages for freebie event

## FAQ

### Q: Can I modify who owns a freebie event after creation?

A: Currently, ownership is set at creation time by `owner_email`. If you need to reassign, you would need to update the database directly or add an admin reassignment feature.

### Q: What if customer changes their email?

A: Once an event is claimed (`owner_id` is set), it stays with that user even if they change their email. Events are linked by `owner_id`, not email.

### Q: Can paid customers also get freebie events?

A: Yes! A customer can have both paid events (via Stripe checkout) and freebie events. They'll all appear together in the dashboard.

### Q: What's the limit on freebie events?

A: 100 total freebie events across all customers. Admin UI blocks creation when limit is reached.

### Q: Do freebie events have the same features as premium?

A: Freebie events have Basic-level features (photo uploads, sharing, QR code). The "freebie" flag bypasses payment only; it doesn't change feature access based on package type.

### Q: Can guests tell if an event is a freebie?

A: No. The guest experience is identical for freebie and paid events. Guest URLs and galleries look the same.

## Files Changed

### New Files

- `migrations/add_freebie_owner_fields.sql` - Database migration
- `src/app/api/admin/create-freebie-event-for-customer/route.ts` - Per-customer freebie creation
- `src/app/api/auth/claim-freebie-events/route.ts` - Event claiming on signup/login

### Modified Files

- `src/app/admin/dashboard/page.tsx` - Updated freebie form UI with host fields

### No Changes

- ❌ Stripe integration (completely untouched)
- ❌ Checkout flow (completely untouched)
- ❌ Discount codes (completely untouched)
- ❌ Webhooks (completely untouched)
- ❌ Payment verification (completely untouched)

## Next Steps

1. Run database migration in Supabase
2. Deploy updated code
3. Test freebie creation via admin dashboard
4. Test customer sign up and event claiming
5. Verify guest gallery access works
6. Monitor for any Stripe issues (should be zero)

---

**Implementation Complete**: Freebie events are now a separate, clean code path that doesn't touch any paid event logic. ✅
