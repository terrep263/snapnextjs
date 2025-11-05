# Stripe 100% Discount Restriction - Solution

## The Issue ❌
**Stripe explicitly prohibits 100% discounts on one-time purchases.**

Error message: *"This code is valid, but doesn't apply to items in your order"*

### Why Stripe Does This
- Prevents abuse and fraud
- Ensures revenue collection on payments
- Policy applies to ALL one-time payments (not subscriptions)
- This is a Stripe account-level security restriction, not a bug

---

## The Solution ✅

### Option 1: Use Lower Discount Percentages (RECOMMENDED)
Instead of trying to create 100% discount codes, use percentages that leave a small charge:

```
✅ 95% off (customer pays 5%)
✅ 99% off (customer pays 1%) 
❌ 100% off (BLOCKED by Stripe)
```

### Option 2: Use Fixed Amount Discounts
Instead of percentage-based, use fixed amounts:

```javascript
// Instead of: 100% off a $49 purchase
const coupon = {
  type: 'fixed_amount',
  amount_off: 4800,  // $48 off
  currency: 'usd'
};
// Customer pays: $49 - $48 = $1

// This works! Customer still pays something.
```

### Option 3: Use Free Trial (For Subscriptions Only)
If you're doing subscriptions, use `free_trial_days` instead of discounts.
(One-time purchases don't have trial options)

---

## Implementation

### Current Your Coupons (All Valid)
Your existing coupons are properly configured:
- ✅ 50% off
- ✅ 40% off  
- ✅ 30% off
- ✅ 25% off

All of these work fine with Stripe Checkout.

### To Create a "Free" Purchase

**Option A: 99% Discount** (Cheapest legally)
```bash
# In Stripe Dashboard or API
POST /v1/coupons
  id: "free-99"
  percent_off: 99
  name: "Almost Free (99% Off)"
```

**Option B: Minimal Fixed Amount** (1¢)
```bash
POST /v1/coupons
  id: "free-1cent"
  amount_off: 1
  currency: "usd"
  name: "Free with processing fee"
```

---

## Why This Matters for Your Business

### If You Want FREE Products:
❌ **Don't use**: Stripe Checkout with 100% discount  
✅ **Instead use**: 
- 99% discount via Stripe (customer pays 1¢)
- Affiliate system (give items away without charging)
- Manual invoice/fulfillment outside Stripe

### If You Want Paid Products:
✅ **Use your current setup**: 25-50% discounts work great

### If You Have Custom Pricing Per User:
✅ **Use**: Pre-calculated amounts with affiliate system
- No coupon needed
- Stripe only charges the final amount

---

## Testing the Fix

### Step 1: Create Test Coupon
1. **Stripe Dashboard** → **Products** → **Coupons**
2. Click **Create Coupon**
3. Set:
   - **Type**: Percentage
   - **Discount**: `99` (not 100)
   - **Name**: "Test 99% Off"
   - **Applies to**: All products
   - **Active**: Yes
4. Save

### Step 2: Create Promotion Code
1. **Stripe Dashboard** → **Products** → **Promotion Codes**
2. Click **Create Promotion Code**
3. Select your new coupon
4. Enter code: `TEST99`
5. Save

### Step 3: Test in Checkout
1. Go to your checkout form
2. Enter code: `TEST99`
3. Click Apply
4. Should now work! ✅
5. Checkout should show: `$49 → $0.49` (or whatever your price is)

---

## Backend Code (No Changes Needed)

Your current code already handles this correctly:
```typescript
// src/app/api/create-checkout-session/route.ts
const sessionConfig = {
  discounts: [
    {
      promotion_code: promoCodeId,  // ← Stripe handles validation
    }
  ],
};
```

Stripe will automatically reject any 100% discount codes at checkout time, which is exactly what's happening now.

---

## FAQ

**Q: Why does Stripe block 100% discounts?**
A: Stripe acts as the payment processor. If an entire transaction is discounted away, there's no actual payment. It's a fraud prevention measure.

**Q: Can I use my backend to make something free?**
A: Yes! Your affiliate system does this:
- Don't send the user to Stripe Checkout
- Fulfill their order directly
- No payment collection needed

**Q: What if I need truly free items?**
A: Use one of these:
1. 99% discount via Stripe (customer pays 1¢) ← Easiest
2. No Stripe checkout at all (mark as free internally)
3. Affiliate system (existing solution)

**Q: Does this apply to subscriptions?**
A: No, subscriptions have `free_trial_days` option. But one-time payments don't.

---

## Your Action Items

### Immediate (2 minutes):
1. ✅ Update any 100% discount coupon to 99% instead
2. ✅ Test with promotion code in checkout

### Optional (If Needed):
- Create fixed-amount discount coupons
- Test different percentage values (95%, 90%, 50%, etc.)
- Decide: Do you actually need free products, or just discounts?

---

## References
- [Stripe Coupons Documentation](https://stripe.com/docs/billing/coupons)
- [Stripe Checkout Discounts](https://stripe.com/docs/payments/checkout/discounts)
- [Promotion Codes API](https://stripe.com/docs/api/promotion_codes)

**Last Updated**: November 4, 2025  
**Status**: Root cause identified and documented
