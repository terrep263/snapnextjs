# Freebie Event Claiming Integration Guide

## Overview

When users sign up or log in, the system automatically claims any unclaimed freebie events assigned to their email address.

## Integration Points

### 1. After Successful Login (in your auth/login handler)

```typescript
import { handleFreebieClaimingOnAuth } from '@/lib/freebie-claiming';

// After user successfully logs in
const handleLoginSuccess = (user: { id: string; email: string }) => {
  // Your existing login logic...
  
  // Claim freebie events (non-blocking)
  handleFreebieClaimingOnAuth(
    user.email,
    user.id,
    (claimedCount) => {
      if (claimedCount > 0) {
        toast.success(`Welcome back! ${claimedCount} freebie event(s) added to your dashboard.`);
      }
    }
  );
  
  // Redirect to dashboard or home
  router.push('/dashboard');
};
```

### 2. After Successful Signup (in your auth/signup handler)

```typescript
import { handleFreebieClaimingOnAuth } from '@/lib/freebie-claiming';
import { toast } from '@/lib/toast';

// After user successfully signs up
const handleSignupSuccess = (user: { id: string; email: string }) => {
  // Your existing signup logic...
  
  // Claim freebie events (non-blocking)
  handleFreebieClaimingOnAuth(
    user.email,
    user.id,
    (claimedCount) => {
      if (claimedCount > 0) {
        toast.success(`🎉 Welcome! ${claimedCount} complimentary event(s) are waiting for you.`);
      }
    }
  );
  
  // Redirect to dashboard
  router.push('/dashboard');
};
```

### 3. Manual Claiming (if user re-opens the app or logs in from another device)

```typescript
import { claimFreebieEventsForUser } from '@/lib/freebie-claiming';

// Call this to manually claim events
const result = await claimFreebieEventsForUser(userEmail, userId);

if (result.success) {
  console.log(`Claimed ${result.claimedCount} events`);
} else {
  console.error('Error:', result.error);
}
```

## File Locations

- **Claiming utility**: `src/lib/freebie-claiming.ts`
- **API endpoint**: `src/app/api/auth/claim-freebie-events/route.ts`
- **Admin creation endpoint**: `src/app/api/admin/create-freebie-event-for-customer/route.ts`

## What Happens When Events Are Claimed

1. User signs up with email `john@example.com`
2. Admin previously created a freebie event with `owner_email = john@example.com`
3. On signup success, claiming is triggered
4. System finds all events where:
   - `owner_email = john@example.com`
   - `is_freebie = true`
   - `owner_id = null` (unclaimed)
5. Sets `owner_id = john_user_id` for all matching events
6. Events now appear in john's dashboard permanently
7. Optional success message shown to user

## Error Handling

The claiming process is **non-blocking** and **non-critical**:
- If claiming fails, login/signup still succeeds
- Errors are logged but not shown to users
- User can manually trigger claiming later by refreshing dashboard
- No Stripe or payment logic affected

## Testing

### Test Case 1: Sign Up with Existing Freebie Event

```bash
1. Create a freebie event via admin dashboard:
   - Host Email: testuser@example.com
   - Event Name: Test Birthday

2. Sign up with email: testuser@example.com

3. After signup:
   - Check success message for "1 complimentary event"
   - Go to dashboard
   - Verify Test Birthday appears in events list
   - Verify event has is_freebie = true in database

4. In Supabase, verify:
   SELECT owner_email, owner_id, is_freebie 
   FROM events 
   WHERE owner_email = 'testuser@example.com';
   
   Should show: owner_id is now set (not NULL)
```

### Test Case 2: Login with Existing Freebie Event

```bash
1. Create a freebie event:
   - Host Email: existing@example.com
   - Event Name: Existing Test

2. User signs up and logs out

3. User logs back in

4. After login:
   - Check if claiming happens again (should be idempotent)
   - Verify dashboard shows event

5. Database state:
   - owner_id should remain the same (no re-claiming)
```

### Test Case 3: Verify Stripe Not Affected

```bash
1. Create both:
   - A paid event (via normal checkout)
   - A freebie event (via admin)

2. User signs up and logs in

3. Verify:
   - Both events appear in dashboard
   - Freebie event has payment_type = 'freebie'
   - Paid event has stripe_session_id set
   - No payment prompts for freebie event
```

## Customization

### Show Custom Message for First-Time Freebie Users

```typescript
const handleSignupSuccess = (user: { id: string; email: string }) => {
  handleFreebieClaimingOnAuth(user.email, user.id, (claimedCount) => {
    if (claimedCount === 1) {
      toast.success('🎁 Welcome! Your complimentary event is ready to use.');
    } else if (claimedCount > 1) {
      toast.success(`🎉 Welcome! You have ${claimedCount} complimentary events.`);
    }
  });
};
```

### Disable Claiming Message

```typescript
// Just call without callback
handleFreebieClaimingOnAuth(user.email, user.id);
```

### Add Claiming to Dashboard Load

If you want to claim events on every dashboard load (belt-and-suspenders approach):

```typescript
// In your dashboard component useEffect
useEffect(() => {
  if (currentUser) {
    claimFreebieEventsForUser(currentUser.email, currentUser.id);
  }
}, [currentUser]);
```

## Security Notes

- Claiming only matches on `owner_email` and checks `owner_id` is null
- Service-role client is used server-side (secure)
- Email must match exactly (case-insensitive comparison recommended)
- Idempotent: claiming same events twice is safe

## Troubleshooting

**Q: Events not showing after signup?**
- Check database: verify `owner_email` matches signup email exactly
- Check API response: call `/api/auth/claim-freebie-events` manually
- Try refreshing dashboard

**Q: Claiming happening too slowly?**
- It's async by design (non-blocking)
- Add optional toast message to let users know
- Events will appear within seconds

**Q: Want to claim events after purchase too?**
- Add same code to post-purchase handler
- Allows mixed freebie + paid events

---

**Status**: Integration ready. See `src/lib/freebie-claiming.ts` for API.
