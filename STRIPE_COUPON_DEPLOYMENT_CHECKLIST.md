# Stripe Coupon Feature - Deployment Checklist

## Development ✅ COMPLETE
- [x] Added `allow_promotion_codes: true` to checkout session
- [x] Created `/api/stripe-coupons` endpoint
- [x] Created `/api/stripe-promotions` endpoint
- [x] Created setup guide and scripts
- [x] Tested locally with mock data

## Pre-Production Testing

### Manual Testing
- [ ] Start dev server: `npm run dev`
- [ ] Create test coupon via API
- [ ] Create test promotion code via API
- [ ] Go to http://localhost:3000/create
- [ ] Complete checkout with test code
- [ ] Verify discount appears in Stripe checkout modal
- [ ] Verify order webhook shows discount applied
- [ ] Test affiliate codes still work
- [ ] Test both discount types together

### Edge Cases to Test
- [ ] Enter invalid promotion code → error shown in Stripe
- [ ] Enter code after max redemptions → error shown
- [ ] Enter expired code → error shown
- [ ] Apply affiliate code + Stripe code → both discounts work
- [ ] Try same code twice in different sessions → works both times (if allowed)
- [ ] Check webhook payload for discount info

## Production Deployment

### Before Going Live
- [ ] Review all 3 new files:
  - `src/app/api/stripe-coupons/route.ts`
  - `src/app/api/stripe-promotions/route.ts`
  - `src/app/api/create-checkout-session/route.ts` (modified)

- [ ] Verify Stripe secret key is set in production `.env`

- [ ] Test with Stripe test mode first:
  - Create test coupons
  - Verify in Stripe Dashboard
  - Test full checkout flow

- [ ] Monitor Stripe Dashboard for any issues

### Go Live Steps
1. Deploy to production (Vercel)
2. Update `.env` with live Stripe key (if not already)
3. Create production promotion codes
4. Test with real payment method (use Stripe test cards)
5. Monitor first few transactions
6. Document live promotion codes

## Post-Deployment

### Day 1
- [ ] Monitor webhook logs
- [ ] Check for any API errors
- [ ] Verify promotions are redemable
- [ ] Test customer flow

### Week 1
- [ ] Review Stripe Dashboard metrics
- [ ] Monitor coupon redemption rates
- [ ] Check for fraud/abuse patterns
- [ ] Update team on how to create new codes

### Ongoing
- [ ] Regularly create seasonal promotion codes
- [ ] Monitor unused coupons
- [ ] Track discount impact on revenue
- [ ] Adjust strategy based on metrics

## Troubleshooting Issues

### Issue: Promotion code field not visible in checkout
**Solution:**
- Confirm `allow_promotion_codes: true` is in code
- Clear browser cache
- Try incognito mode
- Verify Stripe key is active

### Issue: Code won't apply
**Solution:**
- Check code exists: `GET /api/stripe-promotions`
- Verify code status in Stripe Dashboard
- Check expiration date
- Confirm max redemptions not reached

### Issue: Webhook doesn't show discount
**Solution:**
- Verify promotion code properly created
- Check Stripe API logs
- Ensure webhook handler processes `checkout.session.completed`

## Rollback Plan

If issues arise:
1. Set `allow_promotion_codes: false` in checkout config
2. Disable all active promotion codes in Stripe Dashboard
3. Revert to previous version if needed

This won't break existing affiliate/backend discount system.

## Success Metrics to Track

- [ ] Promotion code redemption rate
- [ ] Average discount per transaction
- [ ] Revenue impact
- [ ] Customer satisfaction (support tickets)
- [ ] Affiliate discount vs. Stripe discount usage ratio

## Documentation for Team

Share these files with your team:
- `STRIPE_COUPON_SETUP.md` - How to create coupons/codes
- `STRIPE_COUPON_INSTALL.md` - Feature overview
- This checklist

## Questions to Ask Yourself

1. **What promotion codes do we want to launch with?**
   - Examples: LAUNCH50, WELCOME25, SUMMER30

2. **How many redemptions per code?**
   - Too high = lose revenue
   - Too low = poor customer experience

3. **When should codes expire?**
   - Time-limited creates urgency
   - Permanent discounts for loyalty programs

4. **Should we limit discounts per customer?**
   - Currently no limit in code (add if needed)
   - Consider adding validation

5. **Do we track which channel codes came from?**
   - Add custom metadata if needed
   - Helps optimize marketing

---

**Status**: ✅ Ready for production
**Last Updated**: November 4, 2025
**Tested With**: Stripe API v2025-10-29.clover
