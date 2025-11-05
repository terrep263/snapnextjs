# Troubleshooting: "This code is valid, but doesn't apply to items in your order"

## Root Causes (In Order of Likelihood)

### 1. ⚠️ MOST LIKELY: Coupon Has Product/Price Restrictions

**How to check:**

1. Go to **Stripe Dashboard** → **Billing** → **Coupons**
2. Find your coupon (e.g., "SAVE20")
3. Click to edit it
4. Look for **"Applies to"** or **"Restrictions"** section

**The Problem:**
- If you see "Only applies to specific products" ❌
- If you see "Only applies to specific prices" ❌
- If ANY restriction fields are filled in ❌

**Why This Breaks:**
- Your checkout creates **dynamic prices** (not pre-created Stripe prices)
- Restricted coupons only work with **specific Stripe product/price IDs**
- Dynamic prices don't match those restrictions

**The Fix:**
```
DELETE the coupon and create a new one with:
- NO product restrictions
- NO price restrictions  
- NO plan restrictions
- Leave all "Applies to" fields EMPTY
```

---

### 2. Promotion Code is NOT Active

**How to check:**

1. Go to **Stripe Dashboard** → **Billing** → **Promotion codes**
2. Find your code (e.g., "SAVE20")
3. Check the **Status** column - should say **"Active"** (green)

**If Status is "Inactive":**
- Click the code
- Click **"Activate"** button
- Save

---

### 3. Coupon Has Expired

**How to check:**

1. Go to **Stripe Dashboard** → **Billing** → **Coupons**
2. Find your coupon
3. Look for **"Expiration"** field
4. If it shows a past date, it's expired

**The Fix:**
- Delete the coupon
- Create a new one without an expiration date (or set future date)

---

### 4. Coupon Exists But Promotion Code Doesn't

**How to check:**

1. Go to **Stripe Dashboard** → **Billing** → **Promotion codes**
2. Search for your code
3. If NOT found, the issue is here

**You need BOTH:**
- ✅ Coupon (e.g., internal: "COUPON_SAVE20")
- ✅ Promotion Code (customer-facing: "SAVE20")

**The Fix:**
1. Create the promotion code if missing:
   - **Billing** → **Promotion codes**
   - Click **"Create promotion code"**
   - Select coupon you created
   - Enter **"Redemption code"**: SAVE20
   - Set expiration (optional)
   - Click **"Create"**

---

### 5. API Version Mismatch

Your code uses: `2025-10-29.clover`

**How to check:**
1. Go to **Stripe Dashboard** → **Settings** → **API version**
2. Make sure it matches or is compatible with `2025-10-29.clover`

---

## Step-by-Step Diagnostic Process

### Step 1: Check Your Coupon Configuration

```
Go to: Stripe Dashboard → Billing → Coupons
```

Screenshot what you see. Specifically:
- ✅ Coupon name
- ✅ Type (Percentage off / Fixed amount off)
- ✅ Amount
- ✅ Duration
- ✅ Status (Active/Inactive)
- ✅ Applies to (ANY restrictions?)
- ✅ Expiration date

### Step 2: Check Your Promotion Code

```
Go to: Stripe Dashboard → Billing → Promotion codes
```

Screenshot what you see. Specifically:
- ✅ Code (what you type in checkout)
- ✅ Status (Active/Inactive)
- ✅ Coupon linked to it
- ✅ Expiration date
- ✅ Redemption limit

### Step 3: Test in Stripe's Workbench

Go to **Stripe Dashboard** → **Developers** → **Workbench**

Run this test:

```bash
POST /v1/checkout/sessions
payment_method_types=card
success_url=http://example.com/success
cancel_url=http://example.com/cancel
line_items[0][price_data][currency]=usd
line_items[0][price_data][product_data][name]=Test Product
line_items[0][price_data][unit_amount]=2900
line_items[0][quantity]=1
mode=payment
allow_promotion_codes=true
```

Then try to apply your promotion code in the resulting checkout.

If it works here but not in your app, the issue is in your code.
If it fails here too, the issue is your Stripe coupon/promotion code setup.

### Step 4: Check Vercel Logs

Your app logs show exactly what's happening:

1. Go to **Vercel Dashboard** → Your Project
2. Click **"Deployments"**
3. Click the current deployment
4. Click **"Runtime Logs"**
5. Filter by your test
6. Look for logs with: `Promotion code search` or `Session config`

---

## Common Mistake: Creating Coupon with Restrictions

**WRONG ❌:**
1. Create coupon "SAVE20"
2. During creation, click "Applies to" 
3. Select specific products
4. Save

**RIGHT ✅:**
1. Create coupon "SAVE20"
2. Leave "Applies to" section completely EMPTY
3. NO product restrictions
4. NO price restrictions
5. Save

---

## Quick Fix Checklist

- [ ] Coupon status = Active ✅
- [ ] Promotion code status = Active ✅
- [ ] Coupon has NO product restrictions (section is empty)
- [ ] Coupon has NO price restrictions (section is empty)
- [ ] Coupon expiration is NOT in the past
- [ ] Promotion code is linked to the coupon
- [ ] Promotion code expiration is NOT in the past
- [ ] You're using your LIVE Stripe keys (not test keys)

---

## If STILL Not Working After Checklist

Delete everything and recreate from scratch:

**DELETE:**
1. Promotion code
2. Coupon

**CREATE NEW (Correctly):**

1. **Create Coupon:**
   - Code: `SAVE20_LIVE` (internal)
   - Type: `Percentage off`
   - Amount: `20`
   - Duration: `Forever`
   - **LEAVE ALL RESTRICTION FIELDS EMPTY**
   - Status: Active
   - Save

2. **Create Promotion Code:**
   - Coupon: Select "SAVE20_LIVE" from dropdown
   - Redemption code: `SAVE20`
   - Redemption limit: Leave empty (unlimited)
   - Expiration: Leave empty (never expires)
   - Status: Active
   - Save

3. **Test:**
   - Go to your checkout
   - Enter "SAVE20"
   - Should work now!

---

## Share This Information

Once you complete the diagnostic steps above, share:

1. **Screenshots** of your coupon configuration
2. **Screenshots** of your promotion code configuration
3. **Stripe Workbench test result** (did it work there?)
4. **Vercel runtime logs** (what do the logs show?)

This will help me identify the exact issue! 🔍
