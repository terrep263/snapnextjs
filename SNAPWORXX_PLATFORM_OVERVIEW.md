# SnapWorxx - Complete Platform Overview

## Table of Contents
1. [How It Works](#how-it-works)
2. [Products & Pricing](#products--pricing)
3. [Features by Product](#features-by-product)
4. [User Flows](#user-flows)
5. [Tech Stack & Architecture](#tech-stack--architecture)

---

## How It Works

### The Core Concept
SnapWorxx is a **one-time payment, photo/video sharing platform** designed for events. Instead of cloud storage subscriptions or complex collaboration tools, users create a simple event gallery, share a link or QR code with guests, and guests upload photos and videos directly to the gallery.

### Three Ways to Get Started

#### **1. Create an Event (Host)**
```
User visits snapworxx.com/create
    ↓
Fills out event details (name, date, location)
    ↓
Selects pricing plan (Basic $29 or Premium $49)
    ↓
Completes Stripe checkout
    ↓
Receives event dashboard & sharing links
```

**What Happens After Purchase:**
- Event is created in the database with unique slug (e.g., `/e/birthday-party-2024`)
- Host receives:
  - QR code (branded with SnapWorxx logo + colors)
  - Event URL for sharing
  - Event dashboard to manage photos
  - Option to set event password
  - Header and profile images for branding

#### **2. Upload Photos (Guest - No Account Required)**
```
Guest scans QR code or clicks shared link
    ↓
Lands on event gallery page (/e/[slug])
    ↓
Clicks "Upload Photos" or goes to /e/[slug]/upload
    ↓
Selects photos/videos to upload (drag & drop)
    ↓
Photos instantly appear in gallery
```

**Guest Experience:**
- No login required
- No account creation
- Works on mobile and desktop
- Real-time photo display (with photo count updates)
- Can download individual photos or bulk download all
- Can view and share gallery

#### **3. View & Manage Gallery (Host Dashboard)**
```
Host logs in to dashboard (/dashboard/[eventId])
    ↓
Sees all uploaded photos in masonry grid
    ↓
Can:
  - Download all photos (ZIP)
  - View photo metadata
  - Add header and profile images
  - Set event name and details
  - View live feed of uploads (Premium)
  - See event statistics
```

---

## Products & Pricing

### **Basic Event - $29 (One-Time)**

**What You Get:**
- Unlimited photo uploads from guests
- QR code + direct upload link
- 30-day storage
- Gallery access for sharing
- Instant setup (2 minutes)
- Bulk download all photos
- Photo masonry gallery view

**Perfect For:**
- Small gatherings (birthdays, family dinners)
- One-off events without advanced features
- Casual photo sharing

**Database Fields:**
```
is_free: false
payment_type: 'stripe'
stripe_session_id: [Stripe Session ID]
status: 'active'
storage_expires_at: created_at + 30 days
```

---

### **Premium Event - $49 (One-Time)**

**What You Get:**
- ✅ Everything in Basic
- Live photo feed (see uploads in real-time)
- Password protection for gallery
- 90-day storage
- Advanced analytics
- Custom event branding (header/profile images)
- Priority support

**Perfect For:**
- Large events (weddings, conferences)
- Professional events requiring security
- Events needing extended storage
- Real-time photo monitoring

**Database Fields:**
```
is_free: false
payment_type: 'stripe'
stripe_session_id: [Stripe Session ID]
status: 'active'
storage_expires_at: created_at + 90 days
feed_enabled: true
password_hash: [encrypted]
```

---

### **Free Basic Events** (Promotional/Admin-Managed)

**What They Are:**
- Free event for promotional purposes
- Created by admin for testing or marketing
- Marked as `is_free: true` and `promo_type: 'FREE_BASIC'`
- Full feature access like paid events

**When Used:**
- Demo galleries for marketing
- Test events for QA
- Promotional offerings

**Database Fields:**
```
is_free: true
promo_type: 'FREE_BASIC'
payment_type: null
stripe_session_id: null
status: 'active'
storage_expires_at: created_at + 30 days
```

---

### **Freebie Events** (Limited-Time Offer)

**What They Are:**
- Complimentary events assigned by admin to specific customers
- One-time use per customer
- No Stripe payment required
- Unlimited storage (999GB+)
- Unlimited uploads

**How Admin Creates Them:**
1. Admin goes to `/admin/dashboard`
2. Fills "Create Freebie Event" form:
   - Host Name
   - Host Email (customer email)
   - Event Name
   - Event Date
3. Clicks "Create Freebie Event"
4. Customer receives email or signup link with event

**How Customer Claims It:**
1. Customer signs up or logs in with the email used by admin
2. Automatic claiming triggered on signup/login
3. Freebie event appears in customer's event list
4. Full functionality identical to paid events

**Database Fields:**
```
is_free: true
is_freebie: true
payment_type: 'freebie'
owner_email: [customer_email]
owner_id: [user_id after claiming]
stripe_session_id: null
max_storage_bytes: 999999999
storage_expires_at: null (never expires)
```

---

### **Promo Codes & Discounts**

**How It Works:**
1. User visits `/get-discount` and enters email
2. System generates unique code (e.g., WELCOME1234)
3. Code sent via email with 10-60% discount (configurable)
4. User uses code during checkout
5. Discount applied automatically

**Rate Limiting:**
- 1 code per email per 24 hours
- Prevents abuse
- Tracked in `discount_requests` table

**Use Cases:**
- Early bird discounts
- Email capture campaigns
- Influencer/affiliate promotions
- Customer acquisition

**Database Fields:**
```
discount_offers:
  - code: 'WELCOME1234'
  - discount_percentage: 25
  - max_uses: 100
  - used_count: 5
  - active: true

discount_requests:
  - email: 'user@example.com'
  - generated_code: 'WELCOME1234'
  - requested_at: timestamp
  - used_at: timestamp
```

---

### **Affiliate Program**

**Program Details:**
- **Commission Rate:** 60% (launch period only)
- **Duration:** 90 days from signup
- **One-Time Signup:** No re-registration after period expires
- **Customer Incentive:** 10% off first purchase

**How Affiliates Earn:**
1. Affiliate registers at `/affiliate/register`
2. Gets unique referral link (e.g., `?ref=affiliate_123`)
3. Promotes to their network
4. When someone uses their link and purchases:
   - Customer gets 10% discount
   - Affiliate earns 60% of sale amount
   - Payment tracked in affiliate dashboard
   - Commission paid monthly

**Affiliate Dashboard:**
- Track total referrals
- Monitor commission earnings
- See customer details
- View payment history
- Time remaining in 90-day period

**Database Fields:**
```
affiliates:
  - id: uuid
  - name: string
  - email: string
  - referral_code: string
  - commission_rate: 60
  - registered_at: timestamp
  - expires_at: timestamp (90 days later)
  - status: 'active' | 'expired'

affiliate_commissions:
  - affiliate_id: uuid
  - event_id: string
  - customer_email: string
  - commission_amount: number
  - status: 'pending' | 'paid'
  - created_at: timestamp
```

---

## Features by Product

### **All Events (Basic, Premium, Free Basic, Freebie)**

#### **QR Code Generation** ✅
- Branded with SnapWorxx logo (purple theme)
- Shows company website "snapworxx.com"
- Available in SVG and PNG formats
- Unique per event
- Located in event dashboard

#### **Photo Gallery** ✅
- Masonry grid layout (responsive)
- Optimized for mobile
- Lightbox viewer for full-screen viewing
- Video support with play button
- Search and filtering
- Image type badges (header, profile, photo, video)

#### **Photo Upload** ✅
- Drag & drop interface
- Batch upload multiple files
- Progress tracking per file
- Support for:
  - JPEG, PNG, WebP, GIF
  - MP4, WebM, MOV (videos)
  - Up to 100MB per file
  - 500MB max for videos

#### **Photo Download** ✅
- Individual photo download
- Bulk download all as ZIP
- Selection mode for partial downloads
- Preserves original file quality

#### **Event Sharing** ✅
- Direct URL to gallery
- QR code for scanning
- Social media share buttons
- Copy to clipboard
- Email share option

#### **Event Password Protection** ✅
- Set optional password during event creation
- Guests enter password before uploading/viewing
- Prevents unauthorized access
- Premium feature (also available for Basic)

---

### **Premium Events Only**

#### **Live Photo Feed** 🔴
- Real-time updates when guests upload photos
- Shows new uploads as they arrive
- Configurable refresh rate
- Useful for monitoring during event

#### **Extended Storage**
- 90 days vs 30 days (Basic)
- Photos retain longer
- Suitable for large events with extended planning

#### **Advanced Analytics**
- View upload statistics
- See which photos are most viewed
- Track upload timestamps
- Visitor analytics

#### **Custom Branding**
- Upload header image (displayed at top of gallery)
- Upload profile image (displays as badge)
- Branded gallery experience
- Customizable via dashboard

#### **Advanced Event Management**
- Live feed configuration
- Storage management tools
- Advanced sharing options

---

### **Admin Features** (Backend Only)

#### **Admin Dashboard** 📊
Located at: `/admin/dashboard`

**Stats Section:**
- Total events created
- Breakdown by type (Free Basic, Freebie, Paid)
- Total user emails
- Blocked emails count

**Event Log Table:**
- All events displayed in table format
- Columns:
  - Event Name
  - Event Type (badge)
  - Payment Category (color-coded: Paid/Freebie/Free Promo)
  - User Email
  - Creation Date & Time
  - Photo Count
  - Delete Action
- Pagination (20 items per page)
- Sortable by date
- Color-coded payment indicators

**Freebie Event Creation:**
- Host Name input
- Host Email input (customer)
- Event Name input
- Event Date picker
- Creates unlimited freebie events (up to 100 global limit)
- Auto-generates URLs for customer

**Email Blocking:**
- Block specific emails from using free promo events
- Manage blocked email list
- Block/unblock functionality
- Useful for abuse prevention

#### **Admin Verification**
- Secure cookie-based authentication
- Admin session validation
- Protected API endpoints
- Server-side admin check

---

## User Flows

### **Flow 1: Basic Event Purchase & Share**

```
┌─────────────────────────────────────────────────────────┐
│ 1. Visit snapworxx.com                                  │
│    → Landing page with pricing                          │
│                                                          │
│ 2. Click "Get Started" (Basic $29)                      │
│    → Redirects to /create?plan=basic                    │
│                                                          │
│ 3. Fill Event Details                                   │
│    - Event Name (required)                              │
│    - Date (required)                                    │
│    - Location (optional)                                │
│    - Discount code (optional)                           │
│    → Real-time price calculation                        │
│                                                          │
│ 4. Click "Create Event"                                 │
│    → Stripe Checkout opens                              │
│                                                          │
│ 5. Complete Payment                                     │
│    - Enter card details                                 │
│    - Confirm payment                                    │
│    → Webhook triggers event creation                    │
│                                                          │
│ 6. Event Created ✅                                     │
│    - Unique slug generated                              │
│    - QR code created                                    │
│    - Event ID assigned                                  │
│    → Redirect to dashboard                              │
│                                                          │
│ 7. Share with Guests                                    │
│    - Display QR code                                    │
│    - Share gallery URL                                  │
│    - Send via email/text                                │
│                                                          │
│ 8. Guests Upload Photos                                 │
│    - Scan QR → /e/[slug]                                │
│    - Click Upload → /e/[slug]/upload                    │
│    - Select photos                                      │
│    - Photos appear in gallery instantly                 │
│                                                          │
│ 9. Host Views Dashboard                                 │
│    - /dashboard/[eventId]                               │
│    - See masonry gallery of all photos                  │
│    - Download all as ZIP                                │
│    - View photo metadata                                │
│                                                          │
│ 10. Event Expires                                       │
│     - After 30 days, storage cleaned up                 │
│     - Photos remain in database (archive)               │
│     - Can request retrieval if needed                   │
└─────────────────────────────────────────────────────────┘
```

---

### **Flow 2: Affiliate Referral**

```
┌─────────────────────────────────────────────────────────┐
│ 1. Affiliate Signs Up                                   │
│    - Visit /affiliate/register                          │
│    - Enter name, email, website                         │
│    - Agree to terms                                     │
│    → Account created, 90-day countdown starts           │
│    → Unique referral code generated                     │
│                                                          │
│ 2. Affiliate Promotes                                   │
│    - Get unique link: snapworxx.com?ref=affiliate_123   │
│    - Share on social media, website, email              │
│    - Create content explaining SnapWorxx                │
│                                                          │
│ 3. Someone Clicks Referral Link                         │
│    - Lands on snapworxx.com?ref=affiliate_123           │
│    - Referral token stored in session                   │
│    - Banner shows "Get 10% off with code"               │
│                                                          │
│ 4. Customer Creates Event                               │
│    - Goes to /create                                    │
│    - Sees referral discount applied                     │
│    - Completes purchase                                 │
│    → Commission recorded in affiliate_commissions       │
│    → Affiliate earns 60% of sale amount                 │
│                                                          │
│ 5. Affiliate Tracks Earnings                            │
│    - View /affiliate/dashboard                          │
│    - See total referrals                                │
│    - View commission breakdown                          │
│    - Check payment status                               │
│                                                          │
│ 6. Monthly Payout                                       │
│    - Commissions accumulated over 30 days               │
│    - Payment sent to affiliate bank account             │
│    - Email confirmation with details                    │
│    → Back to step 3 for next referral                   │
└─────────────────────────────────────────────────────────┘
```

---

### **Flow 3: Freebie Event Assignment**

```
┌─────────────────────────────────────────────────────────┐
│ 1. Admin Creates Freebie Event                          │
│    - Visit /admin/dashboard                             │
│    - Fill freebie creation form                         │
│      • Host Name: "Sarah"                               │
│      • Host Email: "sarah@example.com"                  │
│      • Event Name: "Wedding"                            │
│      • Event Date: "2024-06-15"                         │
│    - Click "Create Freebie Event"                       │
│    → Event created with is_freebie=true                 │
│    → owner_email set to sarah@example.com               │
│    → owner_id remains null (unclaimed)                  │
│    → URLs provided to admin                             │
│                                                          │
│ 2. Admin Notifies Customer                              │
│    - Email Sarah the event URL                          │
│    - Share QR code                                      │
│    - Explain unlimited uploads/storage                  │
│                                                          │
│ 3. Customer Signs Up                                    │
│    - Visit snapworxx.com/signup                         │
│    - Enter email: sarah@example.com                     │
│    - Set password                                       │
│    - Complete signup                                    │
│    → Auth handler triggers claiming flow                │
│                                                          │
│ 4. Auto-Claim Freebie Events                            │
│    - On login/signup, system queries:                   │
│      "Find all events where:"                           │
│      - owner_email = sarah@example.com                  │
│      - is_freebie = true                                │
│      - owner_id is null (unclaimed)                     │
│    → All matching events found (e.g., Wedding)          │
│    → Update events set owner_id = sarah_user_id         │
│    → Mark as claimed                                    │
│                                                          │
│ 5. Customer Views Dashboard                             │
│    - Login to /dashboard                                │
│    - Freebie event appears in list                      │
│    - 🎁 "Free Event" badge displayed                    │
│    - Has unlimited storage & uploads                    │
│    - Identical to paid event functionality              │
│                                                          │
│ 6. Guests Upload Photos                                 │
│    - Same as paid events                                │
│    - Photos upload to freebie event                     │
│    - Customer can download/manage                       │
│    - No expiration (never deleted)                      │
│                                                          │
│ 7. Payment Never Required                               │
│    - No Stripe checkout                                 │
│    - No payment gateway                                 │
│    - payment_type = 'freebie' (not 'stripe')            │
│    - stripe_session_id remains null                     │
└─────────────────────────────────────────────────────────┘
```

---

### **Flow 4: Discount Code Redemption**

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Wants Discount                                  │
│    - Visit snapworxx.com/get-discount                   │
│    - Landing page shows discount offer                  │
│    - Enter email address                                │
│                                                          │
│ 2. Generate Unique Code                                 │
│    - Backend receives email                             │
│    - Check if already requested (24h cooldown)          │
│    - Generate unique code: WELCOME1234                  │
│    - Save to discount_requests table                    │
│    - Send branded email with code                       │
│    - Show success message                               │
│                                                          │
│ 3. User Creates Event                                   │
│    - Visit /create                                      │
│    - See discount code input field                      │
│    - Enter code: WELCOME1234                            │
│    - Click "Apply Discount"                             │
│    → Validate code (API call)                           │
│    → Check code active & not expired                    │
│    → Calculate new price with discount                  │
│    → Display savings message                            │
│                                                          │
│ 4. Update Price Display                                 │
│    - Original: $29                                      │
│    - Discount: 25%                                      │
│    - Savings: $7.25                                     │
│    - Final Price: $21.75                                │
│    → User sees real-time price update                   │
│                                                          │
│ 5. Complete Checkout                                    │
│    - Click "Create Event"                               │
│    - Stripe Checkout opens                              │
│    - Amount shown: $21.75 (discounted)                  │
│    - Code included in Stripe metadata                   │
│    - Complete payment                                   │
│                                                          │
│ 6. Event Created at Discounted Price                    │
│    - Webhook updates event metadata                     │
│    - Discount code marked as used                       │
│    - Event created with full functionality              │
│    - Host redirected to dashboard                       │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack & Architecture

### **Frontend**
- **Framework:** Next.js 16.0.1 (React 19.2.0)
- **Build Tool:** Turbopack
- **Styling:** Tailwind CSS
- **UI Components:** Custom components (Button, TextInput, etc.)
- **State Management:** React hooks (useState, useEffect)
- **Animation:** Framer Motion
- **QR Code:** `qrcode` library (1.5.4)
- **Icons:** Lucide React

### **Backend**
- **Runtime:** Node.js on Vercel
- **Framework:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (S3-compatible)
- **Authentication:** Custom cookies + Supabase Auth
- **Email:** Resend API for email campaigns
- **Payments:** Stripe Checkout & Webhooks

### **Database Schema Highlights**

```sql
-- Main tables
CREATE TABLE events (
  id text PRIMARY KEY,
  name text,
  slug text UNIQUE,
  email text,
  status text,
  
  -- Pricing & Payment
  stripe_session_id text,
  payment_type text, -- 'stripe', 'freebie', null
  is_free boolean,
  promo_type text, -- 'FREE_BASIC', etc.
  
  -- Freebie Fields
  is_freebie boolean,
  owner_id text,
  owner_email text,
  owner_name text,
  
  -- Storage & Features
  max_photos integer,
  max_storage_bytes bigint,
  storage_expires_at timestamptz,
  feed_enabled boolean,
  password_hash text,
  
  -- Branding
  header_image text (base64),
  profile_image text (base64),
  
  -- Timestamps
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE photos (
  id uuid PRIMARY KEY,
  event_id text REFERENCES events,
  filename text,
  url text,
  file_path text,
  size bigint,
  type text,
  is_video boolean,
  created_at timestamptz
);

CREATE TABLE discount_requests (
  id uuid PRIMARY KEY,
  email text,
  generated_code text,
  requested_at timestamptz,
  used_at timestamptz
);

CREATE TABLE affiliates (
  id uuid PRIMARY KEY,
  name text,
  email text,
  referral_code text UNIQUE,
  commission_rate numeric,
  registered_at timestamptz,
  expires_at timestamptz
);

CREATE TABLE affiliate_commissions (
  id uuid PRIMARY KEY,
  affiliate_id uuid REFERENCES affiliates,
  event_id text REFERENCES events,
  commission_amount numeric,
  status text, -- 'pending', 'paid'
  created_at timestamptz
);
```

### **API Endpoints**

```
AUTHENTICATION
  POST /api/auth/signup
  POST /api/auth/login
  POST /api/auth/logout
  POST /api/auth/claim-freebie-events

EVENTS
  POST /api/create-checkout-session
  POST /api/checkout/verify-payment
  GET  /api/photos/[eventId]
  POST /api/upload

STRIPE
  GET  /api/stripe/stripe-coupons
  GET  /api/stripe/stripe-promotions
  GET  /api/stripe/discount-offer
  POST /api/checkout/stripe-webhook

ADMIN
  GET  /api/admin/promo-stats
  GET  /api/admin/promo-events
  POST /api/admin/create-freebie-event-for-customer
  POST /api/admin/block-email
  POST /api/admin/delete-event

AFFILIATES
  POST /api/affiliate/register
  GET  /api/affiliate/dashboard
  GET  /api/affiliate/commissions

PROMOTIONAL
  POST /api/discount-offer
```

### **Key Architectural Patterns**

1. **Webhooks for Payment Events**
   - Stripe webhook triggers event creation
   - Ensures payment verification before event access
   - Prevents fraud

2. **Admin Verification**
   - Server-side authentication checks
   - Protected admin endpoints
   - Session cookie validation

3. **Event Claiming**
   - Automatic on signup/login
   - Email-based association
   - One-time claiming per customer

4. **Rate Limiting**
   - Discount codes: 1 per email per 24h
   - Prevents abuse and bulk code generation

5. **Storage Cleanup**
   - Scheduled cleanup jobs (implied)
   - 30-day expiration for Basic events
   - 90-day expiration for Premium events
   - Freebie events never expire

---

## Summary

**SnapWorxx operates as a simple, one-time-payment photo sharing platform with:**

✅ **Paid Products:** Basic ($29) and Premium ($49) events
✅ **Promotional Products:** Free Basic events and Freebie assignments
✅ **Monetization:** Stripe payments, affiliate commissions (60%), discount capture
✅ **Features:** QR codes, photo uploads, galleries, branding, live feeds
✅ **Admin Tools:** Event management, freebie assignment, analytics
✅ **Security:** Password protection, email verification, admin controls

**Core Value Proposition:**
- Fast event setup (2 minutes)
- No accounts needed for guests
- Unlimited uploads per event
- One-time payment (no subscriptions)
- Professional photo gallery experience
