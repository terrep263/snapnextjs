# Stripe Coupon System - Visual Guide

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          SnapWorxx Checkout             │
└─────────────────────────────────────────┘
                    │
                    ▼
    ┌──────────────────────────────┐
    │   Create Checkout Session    │
    │   (Modified Endpoint)        │
    │ + allow_promotion_codes:true │
    └──────────────────────────────┘
                    │
                    ▼
    ┌──────────────────────────────┐
    │   Stripe Checkout Modal      │
    │                              │
    │ 💳 Card Details              │
    │ [Add promotion code] ← NEW!  │
    │                              │
    └──────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
    ┌────────────────┐    ┌──────────────┐
    │ Valid Code     │    │ Invalid Code │
    │ Apply Discount │    │ Show Error   │
    │ Success ✓      │    │ X            │
    └────────────────┘    └──────────────┘
```

---

## 📊 Flow: Creating and Using a Coupon

### Step 1: Create Coupon (Admin Only)
```
POST /api/stripe-coupons
  ├─ couponId: "summer-30"
  ├─ percentOff: 30
  ├─ duration: "repeating"
  ├─ durationInMonths: 3
  └─ maxRedemptions: 1000

↓

Creates in Stripe:
  ID: summer-30
  30% Discount
  3-month validity
  1000 max uses
```

### Step 2: Create Promotion Code
```
POST /api/stripe-promotions
  ├─ code: "SUMMER30"
  ├─ couponId: "summer-30"
  └─ maxRedemptions: 1000

↓

Creates in Stripe:
  Code: SUMMER30
  References: summer-30 coupon
  Ready for customers!
```

### Step 3: Customer Uses Code
```
Customer at Checkout:
  1. Fills out form
  2. Goes to payment
  3. Sees "Add promotion code"
  4. Enters: SUMMER30
  5. Click "Apply"

↓

Stripe validates:
  ✓ Code exists
  ✓ Not expired
  ✓ Not max uses reached
  ✓ Coupon active

↓

Discount Applied:
  30% off total
  Checkout updates
  Customer sees new price
  Complete purchase
```

---

## 💰 Discount Math Example

### Without Coupon
```
Basic Package: $29.00
Premium Package: $49.00
```

### With SUMMER30 (30% off)
```
Basic Package:
  $29.00 × (1 - 0.30) = $20.30 ✓

Premium Package:
  $49.00 × (1 - 0.30) = $34.30 ✓
```

### With Backend Code + Stripe Code (Stacking)
```
Affiliate Code: 10% off
Stripe Code: 30% off

Premium Package:
  $49.00 (base)
  × (1 - 0.10) = $44.10 (affiliate)
  → Then Stripe applies 30%
  → Final: $30.87 ✓

Both discounts stack!
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│   Your Backend  │
│   create-       │
│   checkout-     │
│   session       │
└────────┬────────┘
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
    ┌─────────┐              ┌──────────────┐
    │ Validate│              │ Create       │
    │ Backend │              │ Session with │
    │ Discount│              │ allow_promo: │
    │ Code    │              │ true         │
    └────┬────┘              └──────┬───────┘
         │                         │
         │                         ▼
         │                    ┌──────────────┐
         │                    │ Stripe       │
         │                    │ Checkout     │
         │                    │ Session ID   │
         │                    └──────┬───────┘
         │                         │
         ▼                         ▼
    ┌───────────────────────────────────┐
    │  Customer Sees Checkout           │
    │  - Backend discount (if applied)  │
    │  - "Add promotion code" button    │
    └───────────────────────────────────┘
             │
             ▼
    ┌───────────────────────────────────┐
    │  Customer Enters Stripe Code      │
    │  - Code validated by Stripe       │
    │  - Discount applied immediately  │
    │  - Both stacked together!         │
    └───────────────────────────────────┘
             │
             ▼
    ┌───────────────────────────────────┐
    │  Payment Processed                │
    │  - Discount metadata in webhook   │
    │  - Order created with discount    │
    │  - Email sent to customer         │
    └───────────────────────────────────┘
```

---

## 📱 UI Flow: Customer's Perspective

```
1. Visit SnapWorxx Checkout Page
   ┌──────────────────────────────┐
   │ Event Name: [____________]   │
   │ Email: [_________________]   │
   │ Package: [Basic / Premium]   │
   │ [Checkout Button]            │
   └──────────────────────────────┘
   
   ↓ Click Checkout
   
2. Stripe Checkout Modal Appears
   ┌──────────────────────────────┐
   │  SnapWorxx Payment           │
   │                              │
   │  $49.00 or more             │
   │                              │
   │  [Card Number __________]    │
   │  [Add promotion code] ← NEW! │
   │                              │
   │  [Pay $49.00]                │
   └──────────────────────────────┘
   
   ↓ Click "Add promotion code"
   
3. Promotion Code Input Appears
   ┌──────────────────────────────┐
   │  Enter promotion code:       │
   │  [SUMMER30_________]         │
   │  [Apply] [Cancel]            │
   └──────────────────────────────┘
   
   ↓ Click Apply
   
4. Code Applied - Price Updates!
   ┌──────────────────────────────┐
   │  SnapWorxx Payment           │
   │                              │
   │  Subtotal:     $49.00        │
   │  Discount:     -$14.70 (-30%)│
   │               ─────────────   │
   │  Total:        $34.30  ✓     │
   │                              │
   │  Promo "SUMMER30" applied    │
   │                              │
   │  [Pay $34.30]                │
   └──────────────────────────────┘
   
   ↓ Click Pay
   
5. Payment Success
   ┌──────────────────────────────┐
   │  Payment Successful! ✓       │
   │                              │
   │  Order details with          │
   │  discount applied            │
   └──────────────────────────────┘
```

---

## 🛠️ API Integration Map

```
Your App
├─ Frontend (Checkout Page)
│  └─ Sends user to Stripe
│
├─ Backend API
│  ├─ POST /api/create-checkout-session
│  │  └─ Validates backend discounts
│  │  └─ Creates session with allow_promotion_codes
│  │  └─ Returns Stripe URL
│  │
│  ├─ POST /api/stripe-coupons [Admin]
│  │  └─ Creates Stripe coupons
│  │
│  ├─ GET /api/stripe-coupons [Admin]
│  │  └─ Lists all coupons
│  │
│  ├─ POST /api/stripe-promotions [Admin]
│  │  └─ Creates promotion codes
│  │
│  └─ GET /api/stripe-promotions [Admin]
│     └─ Lists all codes
│
└─ Stripe System
   ├─ Validates promotion codes
   ├─ Applies discounts
   └─ Processes payment
```

---

## 📈 Example Promotion Code Timeline

```
2025-11-04  ║  Launch
            ║  Code: LAUNCH50
            ║  Discount: 50%
            ║  Expires: 2025-11-14 (10 days)
            ║  Max: 200 uses
            ║
            ║  Status: ACTIVE → 5 customers use it
            ║
2025-11-08  ║
            ║  Holiday Sale Prep
            ║  Code: HOLIDAY40
            ║  Discount: 40%
            ║  Expires: 2025-11-25 (17 days)
            ║
2025-11-15  ║
            ║  LAUNCH50 Expired ✓
            ║  But HOLIDAY40 still active
            ║
2025-11-26  ║
            ║  All codes expired or inactive
            ║
2025-12-01  ║
            ║  New Year Promotion
            ║  Code: NEWYEAR30
            ║  Discount: 30%
            ║  Expires: 2026-01-31
```

---

## 🔐 Security Flow

```
Customer enters code in checkout
        ↓
Stripe receives code
        ↓
Stripe validates:
├─ Code exists? ✓
├─ Code active? ✓
├─ Coupon valid? ✓
├─ Not expired? ✓
├─ Uses remaining? ✓
├─ Customer in allowed country? ✓
└─ No fraud detected? ✓
        ↓
Code ACCEPTED ✓
Discount applied
        ↓
Payment processed with discount
        ↓
Webhook sent to your backend
with discount metadata
        ↓
You can audit/track/report on it
```

---

## 📊 Monitoring Dashboard

```
Stripe Dashboard View
├─ Products
│  └─ Coupons
│     ├─ summer-30
│     │  ├─ 30% Discount
│     │  ├─ Times Redeemed: 147
│     │  └─ Status: Active
│     │
│     └─ holiday-40
│        ├─ 40% Discount
│        ├─ Times Redeemed: 89
│        └─ Status: Active
│
├─ Billing
│  └─ Promotion Codes
│     ├─ SUMMER30
│     │  ├─ Status: Active
│     │  ├─ Redeemed: 147 times
│     │  └─ Expires: 2025-12-31
│     │
│     └─ HOLIDAY40
│        ├─ Status: Active
│        ├─ Redeemed: 89 times
│        └─ Expires: 2025-11-25
│
└─ Payments
   └─ Transactions with discounts
      ├─ Order 1: $34.30 (30% off)
      ├─ Order 2: $29.40 (40% off)
      └─ Order 3: $44.10 (10% off)
```

---

## ✨ Features at a Glance

```
┌─────────────────────────────────────┐
│         Stripe Coupons              │
├─────────────────────────────────────┤
│ Discount Types                      │
│  • Percentage off (0-100%)          │
│  • Fixed amount off ($)             │
│                                     │
│ Duration Options                    │
│  • Forever (unlimited)              │
│  • Repeating (3 months, 6 months)  │
│  • Once (single month)              │
│                                     │
│ Limits & Controls                   │
│  • Max redemptions per code         │
│  • Expiration dates                 │
│  • Redeemable by date               │
│  • Active/inactive toggle           │
│                                     │
│ Tracking                            │
│  • Times redeemed counter           │
│  • Stripe Dashboard reporting       │
│  • Webhook integration              │
│  • Revenue impact analysis          │
└─────────────────────────────────────┘
```

---

**Last Updated**: November 4, 2025
**Ready for**: Production Use
