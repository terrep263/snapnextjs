#!/bin/bash
# Quick setup script for Stripe promotion codes
# Run this to set up example promotion codes

BASE_URL="http://localhost:3000/api"

echo "🎉 SnapWorxx Stripe Coupon Setup Script"
echo "========================================"
echo ""

# Create coupons first
echo "📝 Creating coupons..."

# Coupon 1: Launch 50% off
echo "Creating 'launch-50-off' coupon..."
curl -s -X POST "$BASE_URL/stripe-coupons" \
  -H "Content-Type: application/json" \
  -d '{
    "couponId": "launch-50-off",
    "percentOff": 50,
    "duration": "repeating",
    "durationInMonths": 1,
    "maxRedemptions": 100,
    "redeemByDays": 30
  }' | jq '.'

echo ""
echo "Creating 'summer-30-off' coupon..."
curl -s -X POST "$BASE_URL/stripe-coupons" \
  -H "Content-Type: application/json" \
  -d '{
    "couponId": "summer-30-off",
    "percentOff": 30,
    "duration": "repeating",
    "durationInMonths": 3
  }' | jq '.'

echo ""
echo "Creating 'friend-referral-20-off' coupon..."
curl -s -X POST "$BASE_URL/stripe-coupons" \
  -H "Content-Type: application/json" \
  -d '{
    "couponId": "friend-referral-20-off",
    "percentOff": 20,
    "duration": "forever"
  }' | jq '.'

echo ""
echo "---"
echo ""
echo "✅ Creating promotion codes..."

# Create promotion codes
echo "Creating 'LAUNCH50' promotion code..."
curl -s -X POST "$BASE_URL/stripe-promotions" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "LAUNCH50",
    "couponId": "launch-50-off",
    "maxRedemptions": 100,
    "expiresInDays": 30
  }' | jq '.'

echo ""
echo "Creating 'SUMMER30' promotion code..."
curl -s -X POST "$BASE_URL/stripe-promotions" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER30",
    "couponId": "summer-30-off"
  }' | jq '.'

echo ""
echo "Creating 'FRIEND20' promotion code..."
curl -s -X POST "$BASE_URL/stripe-promotions" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "FRIEND20",
    "couponId": "friend-referral-20-off"
  }' | jq '.'

echo ""
echo "========================================"
echo "✨ Setup complete!"
echo ""
echo "Try these codes in checkout:"
echo "  - LAUNCH50 (50% off, expires in 30 days)"
echo "  - SUMMER30 (30% off)"
echo "  - FRIEND20 (20% off)"
echo ""
echo "List all codes: curl $BASE_URL/stripe-promotions"
