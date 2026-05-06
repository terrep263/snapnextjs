# How to Manually Redeploy on Vercel

## Quick Steps

1. **Go to Vercel Dashboard**: https://vercel.com/thrive-55/snapnextjs

2. **Click "Deployments"** tab (top of page)

3. **Find your latest deployment** (should say "cd1ea89" or similar)

4. **Click the three dots (...)** next to it

5. **Select "Redeploy"**

6. **Wait 2-3 minutes** for the build to complete

---

## What's Been Deployed

✅ **New Promotion Code Validation Endpoint**
- `/api/validate-promo` - Validates promotion codes
- Returns promotion code ID and discount details

✅ **Updated Checkout Session**
- Accepts `promoCodeId` parameter
- Automatically applies promotion codes to checkout

✅ **Frontend Form Integration**
- Users can enter promotion codes
- Shows discount confirmation
- Passes code to Stripe checkout

---

## Testing After Redeploy

1. Go to your site checkout page
2. Enter a **valid promotion code** (from your Stripe dashboard)
3. Click "Apply"
4. Should see confirmation message
5. Click "Create Event"
6. Promotion code should be applied in Stripe checkout

---

## If Still Not Working

**Check these in your Stripe Dashboard:**

1. **Billing** → **Promotion codes**
   - Code must be "Active"
   - Code must have an associated coupon

2. **Billing** → **Coupons**
   - Coupon must have NO restrictions (no product/price limitations)
   - Coupon must be "Active"

3. **API Keys**
   - Make sure you're using LIVE keys in production
   - Not test keys

---

## Recent Changes

- Commit `71c4efe`: Added promotion code form integration
- Commit `aed8e56`: Force redeploy trigger
- Commit `cd1ea89`: Another force redeploy trigger

All changes pushed to GitHub main branch and ready for deployment.
