# Stripe Coupon & Promotion Code Setup Guide

## Overview

Your SnapWorxx checkout now supports **two coupon systems**:

1. **Backend Discount Codes** - Custom codes managed by your app (already implemented)
2. **Stripe Promotion Codes** - Native Stripe codes that customers see in checkout *(newly added)*

---

## How It Works

### Backend Discount Codes (Existing)
- Codes like `LAUNCH50`, `EARLY30`, `WELCOME25` are validated server-side
- Applied before Stripe checkout is created
- Good for affiliate/email-based discounts

### Stripe Promotion Codes (New)
- Customers can enter codes directly in the Stripe checkout modal
- Codes like `SAVE50`, `SUMMER20` are created in Stripe dashboard or via API
- Allows `allow_promotion_codes: true` in checkout

---

## Setup Instructions

### Step 1: Create a Stripe Coupon

Use the API endpoint to create a coupon:

```bash
curl -X POST http://localhost:3000/api/stripe-coupons \
  -H "Content-Type: application/json" \
  -d '{
    "couponId": "50-percent-off",
    "percentOff": 50,
    "duration": "repeating",
    "durationInMonths": 3
  }'
```

**Parameters:**
- `couponId` (required) - Unique ID for the coupon in Stripe
- `percentOff` - Discount percentage (0-100)
- `amountOff` - Fixed amount discount in cents
- `duration` - `forever`, `repeating`, or `once`
- `durationInMonths` - For repeating coupons
- `maxRedemptions` - Limit total uses
- `redeemByDays` - Days until coupon expires

### Step 2: Create a Promotion Code

Promotion codes are the customer-facing codes:

```bash
curl -X POST http://localhost:3000/api/stripe-promotions \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE50",
    "couponId": "50-percent-off",
    "maxRedemptions": 100,
    "expiresInDays": 30
  }'
```

**Parameters:**
- `code` (required) - Customer enters this (e.g., "SAVE50")
- `couponId` (required) - Links to coupon created in Step 1
- `maxRedemptions` - Max number of times this code can be used
- `expiresInDays` - Days until code expires

### Step 3: Verify Your Setup

List all active promotion codes:

```bash
curl http://localhost:3000/api/stripe-promotions
```

Response example:
```json
{
  "promotions": [
    {
      "id": "promo_123...",
      "code": "SAVE50",
      "couponId": "50-percent-off",
      "couponPercentOff": 50,
      "active": true,
      "timesRedeemed": 5,
      "maxRedemptions": 100
    }
  ]
}
```

---

## Example Promotion Codes to Create

### Launch Special
```bash
curl -X POST http://localhost:3000/api/stripe-coupons \
  -H "Content-Type: application/json" \
  -d '{
    "couponId": "launch-50-off",
    "percentOff": 50,
    "duration": "repeating",
    "durationInMonths": 1,
    "maxRedemptions": 50,
    "redeemByDays": 14
  }'

curl -X POST http://localhost:3000/api/stripe-promotions \
  -H "Content-Type: application/json" \
  -d '{
    "code": "LAUNCH50",
    "couponId": "launch-50-off",
    "maxRedemptions": 50,
    "expiresInDays": 14
  }'
```

### Summer Sale
```bash
curl -X POST http://localhost:3000/api/stripe-coupons \
  -H "Content-Type: application/json" \
  -d '{
    "couponId": "summer-30-off",
    "percentOff": 30,
    "duration": "repeating",
    "durationInMonths": 3
  }'

curl -X POST http://localhost:3000/api/stripe-promotions \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER30",
    "couponId": "summer-30-off"
  }'
```

### Holiday Flash Sale
```bash
curl -X POST http://localhost:3000/api/stripe-coupons \
  -H "Content-Type: application/json" \
  -d '{
    "couponId": "holiday-40-off",
    "percentOff": 40,
    "duration": "once"
  }'

curl -X POST http://localhost:3000/api/stripe-promotions \
  -H "Content-Type: application/json" \
  -d '{
    "code": "HOLIDAY40",
    "couponId": "holiday-40-off",
    "maxRedemptions": 200,
    "expiresInDays": 1
  }'
```

---

## Testing in Development

### 1. Start your app
```bash
npm run dev
```

### 2. Create a test coupon and promotion code
```bash
curl -X POST http://localhost:3000/api/stripe-coupons \
  -H "Content-Type: application/json" \
  -d '{
    "couponId": "test-25-off",
    "percentOff": 25,
    "duration": "forever"
  }'

curl -X POST http://localhost:3000/api/stripe-promotions \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST25",
    "couponId": "test-25-off"
  }'
```

### 3. Go to checkout and try the code
- Visit: http://localhost:3000/create
- Fill out form and go to checkout
- In the Stripe checkout modal, click "Add promotion code"
- Enter: `TEST25`
- Verify discount is applied

---

## Backend Discount Codes vs Stripe Promotion Codes

| Feature | Backend | Stripe |
|---------|---------|--------|
| **Entry Method** | Form field | Stripe checkout modal |
| **Visible to Customer** | Only if you show field | Always visible in checkout |
| **Custom Logic** | Full control | Stripe-managed |
| **Affiliate Support** | Yes (built-in) | Via manual setup |
| **Best For** | Partner/email campaigns | General promotions |

---

## Combining Both Systems

Your checkout now supports **both systems simultaneously**:

1. **Backend discount** applied → Reduces price before checkout
2. **Stripe promotion** → Customer can apply additional code at checkout

Example:
- Customer has affiliate code "MYAFFILIATE" (10% off)
- Customer also enters Stripe code "SUMMER30" (30% off)
- Both discounts stack in Stripe checkout!

---

## API Endpoints Reference

### Coupons
- `GET /api/stripe-coupons` - List all coupons
- `POST /api/stripe-coupons` - Create new coupon

### Promotion Codes
- `GET /api/stripe-promotions` - List all promotion codes
- `POST /api/stripe-promotions` - Create new promotion code

### Checkout
- `POST /api/create-checkout-session` - Create checkout (supports both discount types)

---

## Production Considerations

### Security
1. Validate coupon codes server-side before creating Stripe session
2. Monitor for coupon code abuse (unusually high redemptions)
3. Set `maxRedemptions` on all promotional codes
4. Use `expiresInDays` to auto-retire codes

### Monitoring
1. Check coupon redemption rates in Stripe Dashboard
2. Monitor webhook events for discount-related transactions
3. Track revenue impact per promotion code

### Best Practices
1. Create new codes for each campaign (trackable)
2. Set expiration dates on time-limited promotions
3. Use descriptive coupon IDs (e.g., "black-friday-2025")
4. Limit redemptions on flash sales
5. Don't mix fixed-amount and percentage coupons in same promotion

---

## Troubleshooting

### Promotion code not appearing in checkout
- Ensure `allow_promotion_codes: true` is set in checkout config ✓ (already done)
- Verify promotion code is active in Stripe Dashboard
- Check promotion code expiration date

### Coupon not applying
- Verify coupon ID is correct
- Check if coupon has `maxRedemptions` limit reached
- Verify coupon hasn't expired (`redeem_by` date)

### Getting "Promotion code not found" error
- Confirm promotion code exists: `GET /api/stripe-promotions`
- Code is case-sensitive (converted to uppercase automatically)
- Wait a moment for Stripe to sync the code

---

## Next Steps

1. ✅ Coupon system is now live
2. Create your first promotion codes (see examples above)
3. Test in sandbox/development environment
4. Set up webhook to track discount usage (optional)
5. Monitor promotion performance in Stripe Dashboard
