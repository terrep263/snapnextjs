# Fix: "This code is valid, but doesn't apply to items in your order"

## Problem
The Stripe error means your coupon code exists but isn't configured to work with your dynamic prices.

## Solution

### Step 1: Check Your Coupon Configuration in Stripe Dashboard

1. Go to **Stripe Dashboard** → **Billing** → **Coupons**
2. Click on your coupon code
3. Look for **"Applies to"** or **"Restrictions"** section

### Step 2: Make Sure Coupon is UNRESTRICTED

Your coupon should NOT have any of these restrictions:
- ❌ Limited to specific Products
- ❌ Limited to specific Prices
- ❌ Limited to specific Plans

### Step 3: Create New Coupon Correctly

1. Go to **Stripe Dashboard** → **Billing** → **Coupons**
2. Click **"Create coupon"**
3. Fill in:
   - **Coupon code**: `SAVE20` (or whatever you want)
   - **Type**: Choose either:
     - **Percentage off**: `20` (for 20% off)
     - **Fixed amount off**: `500` (for $5 off)
   - **Duration**: 
     - `Once` - applies one time
     - `Repeating` - applies multiple times (set duration)
     - `Forever` - always applies
4. **Leave all other fields blank/default** - don't add restrictions
5. Click **"Create coupon"**

### Step 4: Test in Checkout

1. Go to your app's checkout: `https://yourdomain.com/create`
2. Click **"+ Add promotion code"** button
3. Enter your coupon code
4. It should apply and show the discount

## If Error Persists

### Option A: Delete and Recreate
1. Delete the problematic coupon from Stripe Dashboard
2. Create a new one following Step 3 above
3. Test again

### Option B: Check Stripe API Version
Make sure the coupon was created in the same API version as your checkout session.

Current code uses API version: `2025-10-29.clover`

### Option C: Use Promotion Codes Instead

If coupons still don't work, use **Promotion Codes** which are more flexible:

1. In Stripe Dashboard → **Billing** → **Promotion codes**
2. Click **"Create promotion code"**
3. Select a coupon (or create new one first)
4. Enter a **Redemption code** (e.g., `SAVE20`, `AFFILIATE10`, etc.)
5. Set expiration date if needed
6. Click **"Create"**

Then customers can use the redemption code in checkout.

## Debugging Steps

### Check Session Configuration
The checkout code now creates sessions with:
```typescript
allow_promotion_codes: true
```

This enables the promotion code button in Stripe checkout. ✅

### Verify Coupon in API
Run this in your Stripe Dashboard → Workbench:
```
POST /v1/checkout/sessions
payment_method_types=card
success_url=http://example.com
cancel_url=http://example.com
line_items[0][price_data][currency]=usd
line_items[0][price_data][product_data][name]=Test Product
line_items[0][price_data][unit_amount]=2900
line_items[0][quantity]=1
mode=payment
allow_promotion_codes=true
```

Then try applying your coupon code in the resulting checkout session.

## Summary

**For dynamic prices (prices created in code):**
- Coupons MUST be **unrestricted** (no product/price/plan limitations)
- OR use **Promotion Codes** linked to unrestricted coupons

**Current Setup:**
- ✅ Backend creates prices dynamically
- ✅ Stripe checkout session allows promotion codes
- ✅ Customers see "Add promotion code" button
- ✅ Coupon must be unrestricted to work

---

**Need to create coupons for affiliates?**
Create separate coupon codes:
- `AFFILIATE10` - 10% off for affiliate referrals
- `LAUNCH20` - 20% off for launch promo
- `EARLYBIRD30` - 30% off for early users

Each must be **unrestricted** to work with dynamic pricing!
