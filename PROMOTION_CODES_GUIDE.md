# Stripe Promotion Code Integration

## Overview

The system now uses Stripe's **Promotion Codes** API for discount management. This is the correct approach for Stripe checkout sessions.

## How It Works

### 1. Validate Promotion Code

**Endpoint:** `POST /api/validate-promo`

**Request:**
```json
{
  "code": "SAVE20"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "promoCode": {
    "id": "promo_xxxxx",
    "code": "SAVE20",
    "percentOff": 20,
    "amountOff": null,
    "couponId": "cou_xxxxx"
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "message": "Invalid promotion code"
}
```

### 2. Create Checkout Session with Promotion Code

**Endpoint:** `POST /api/create-checkout-session`

**Request with Promotion Code:**
```json
{
  "eventName": "My Event",
  "eventDate": "2025-12-01",
  "emailAddress": "customer@example.com",
  "yourName": "John Doe",
  "package": "premium",
  "price": 4900,
  "promoCodeId": "promo_xxxxx"
}
```

The checkout session will be created with the promotion code applied automatically.

## API Endpoints

### `/api/validate-promo` - Validate Promotion Code

Finds a promotion code by its customer-facing code and returns details.

- **Method:** POST
- **Parameters:**
  - `code` (string, required): The promotion code customer enters

### `/api/create-checkout-session` - Create Checkout

Creates a Stripe checkout session. Optionally applies a promotion code.

- **Method:** POST
- **Parameters:**
  - `eventName` (string, required)
  - `eventDate` (string, optional)
  - `emailAddress` (string, required)
  - `yourName` (string, optional)
  - `package` (string, required): 'basic' or 'premium'
  - `price` (number, optional): Price in cents
  - `promoCodeId` (string, optional): Promotion code ID from validate-promo endpoint

## Frontend Integration Example

```typescript
// 1. Validate promotion code
const validatePromo = async (code: string) => {
  const response = await fetch('/api/validate-promo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  
  const data = await response.json();
  if (data.valid) {
    return data.promoCode.id; // Save this for checkout
  }
  return null;
};

// 2. Create checkout with promotion code
const createCheckout = async (promoCodeId?: string) => {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: 'My Event',
      eventDate: '2025-12-01',
      emailAddress: 'customer@example.com',
      yourName: 'John Doe',
      package: 'premium',
      promoCodeId, // Optional
    }),
  });
  
  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe checkout
};
```

## Setting Up Promotion Codes in Stripe

### Step 1: Create a Coupon

1. Go to **Stripe Dashboard** → **Billing** → **Coupons**
2. Click **"Create coupon"**
3. Fill in:
   - **Coupon code**: (internal, e.g., `COUPON_SAVE20`)
   - **Type**: `Percentage off` or `Fixed amount off`
   - **Amount**: `20` (for 20% off)
   - **Duration**: Choose based on your needs
4. **Leave all restriction fields empty** - no product/price restrictions
5. Click **"Create coupon"**

### Step 2: Create a Promotion Code

1. Go to **Stripe Dashboard** → **Billing** → **Promotion codes**
2. Click **"Create promotion code"**
3. Fill in:
   - **Coupon**: Select the coupon you just created
   - **Redemption code**: `SAVE20` (what customers enter)
   - **Redemption limit** (optional): Limit number of uses
   - **Expiration date** (optional): When code expires
4. Click **"Create promotion code"**

### Step 3: Test It

1. Go to your checkout page: `https://yourdomain.com/create`
2. Enter the promotion code in Stripe checkout
3. The discount should apply automatically

## Why This Approach?

✅ **Correct API Usage**: Uses Stripe's promotionCodes API as intended  
✅ **Flexible**: Works with dynamic prices (not restricted to products)  
✅ **Customer-Friendly**: Shows in Stripe's "Add promotion code" button  
✅ **Backend-Friendly**: Can pre-apply codes or let customers enter them  
✅ **Audit Trail**: All promotions tracked in Stripe Dashboard  

## Troubleshooting

### "This code is valid, but doesn't apply to items in your order"

**Cause**: Coupon has product/price restrictions

**Fix**: 
1. Delete the coupon
2. Create a new one with NO restrictions
3. Create a new promotion code linked to it

### Promotion code not found

**Cause**: Code is inactive or doesn't exist

**Check**:
1. Code must be marked "Active" in Stripe Dashboard
2. Code must be created (not just the coupon)
3. Use the redemption code, not the coupon code

### Can't see promotion code in checkout

**Cause**: Session not created with `allow_promotion_codes: true`

**Check**:
1. ✅ Checkout session includes `allow_promotion_codes: true`
2. ✅ You're using Stripe's hosted checkout (not custom elements)
3. ✅ Mode is `'payment'`, `'subscription'`, or `'setup'`

## Summary

- **Validate codes**: `POST /api/validate-promo`
- **Create checkout**: `POST /api/create-checkout-session` with optional `promoCodeId`
- **Stripe config**: Create unrestricted coupons + promotion codes
- **Result**: Customers see discounts applied in Stripe checkout! 🎉
