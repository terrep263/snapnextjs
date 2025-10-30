# 🚀 Deployment Checklist for SnapWorxx Next.js

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] All files are in place
- [ ] Dependencies installed (`npm install`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Development server runs (`npm run dev`)
- [ ] No TypeScript errors
- [ ] No console errors in browser

### ✅ Environment Setup
- [ ] `.env.local` created with all required variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] All environment variable values are correct
- [ ] Tested with actual API keys (not placeholders)

### ✅ Git Repository
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is accessible
- [ ] `.gitignore` excludes sensitive files
- [ ] `.env.local` is NOT committed

### ✅ Supabase Setup
- [ ] Database tables created:
  - [ ] `customers` table
  - [ ] `events` table
  - [ ] `uploads` table
- [ ] Edge Functions deployed:
  - [ ] `checkout` function
  - [ ] `stripe-webhook` function
  - [ ] `get-event-by-session` function
  - [ ] `send-event-email` function
- [ ] Storage buckets created (if needed)
- [ ] Row Level Security (RLS) policies configured

### ✅ Stripe Setup
- [ ] Stripe account created
- [ ] Products created:
  - [ ] Basic Package ($29)
  - [ ] Premium Package ($49)
- [ ] Webhook endpoint configured
- [ ] Test mode verified working

## Deployment Steps

### 1. Vercel Account Setup
- [ ] Created/logged into Vercel account
- [ ] Connected GitHub account to Vercel

### 2. Import Project
- [ ] Clicked "New Project" in Vercel
- [ ] Selected the correct repository
- [ ] Framework detected as "Next.js"

### 3. Configure Project
- [ ] Project name set
- [ ] Root directory correct (default)
- [ ] Build command: `npm run build` (or leave default)
- [ ] Output directory: `.next` (or leave default)

### 4. Environment Variables
Added all environment variables in Vercel:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production, Preview, Development
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production, Preview, Development
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Production, Preview, Development

### 5. Deploy
- [ ] Clicked "Deploy" button
- [ ] Waited for deployment to complete
- [ ] Checked deployment logs for errors

## Post-Deployment Checklist

### ✅ Verification
- [ ] Deployment successful (green checkmark)
- [ ] Production URL accessible
- [ ] No errors in deployment logs

### ✅ Functional Testing
- [ ] Home page loads correctly
  - [ ] Video background plays
  - [ ] Logo displays
  - [ ] Navigation works
  - [ ] Pricing cards visible
  - [ ] CTA buttons work
- [ ] Create event page works
  - [ ] Form fields editable
  - [ ] Package selection toggles
  - [ ] Submit button responsive
- [ ] Stripe integration works
  - [ ] Redirects to Stripe
  - [ ] Test payment processes
  - [ ] Returns to success page
- [ ] Success page displays
  - [ ] Dashboard button (if available)
  - [ ] Email confirmation message
  - [ ] Next steps visible

### ✅ Responsive Testing
- [ ] Mobile view (375px)
- [ ] Tablet view (768px)
- [ ] Desktop view (1024px+)
- [ ] Navigation works on mobile
- [ ] Forms usable on mobile

### ✅ Performance Check
- [ ] Lighthouse score > 90
- [ ] Images load quickly
- [ ] No layout shift
- [ ] Fast First Contentful Paint

### ✅ Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Configuration Updates

### Update Supabase
- [ ] Add Vercel domain to Supabase allowed URLs:
  - Go to Authentication → URL Configuration
  - Add: `https://your-app.vercel.app`
  - Add: `https://your-app.vercel.app/success`

### Update Stripe
- [ ] Update success URL in Stripe:
  - `https://your-app.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`
- [ ] Update cancel URL:
  - `https://your-app.vercel.app/create`
- [ ] Test webhook endpoint (if using)

### Custom Domain (Optional)
- [ ] Domain purchased
- [ ] DNS configured in Vercel
- [ ] SSL certificate active
- [ ] www redirect configured
- [ ] Updated Supabase URLs
- [ ] Updated Stripe URLs

## Monitoring Setup

### Vercel Analytics
- [ ] Analytics enabled in project settings
- [ ] Core Web Vitals tracked

### Error Tracking
- [ ] Check Function logs regularly
- [ ] Set up error alerts (optional)

## Production Readiness

### Security
- [ ] No API keys in client code
- [ ] Environment variables secure
- [ ] HTTPS enforced
- [ ] CORS configured correctly

### SEO
- [ ] Metadata configured
- [ ] OG images set
- [ ] Sitemap generated (if needed)
- [ ] robots.txt configured

### Legal
- [ ] Privacy policy link (if needed)
- [ ] Terms of service (if needed)
- [ ] Cookie consent (if needed)

## Rollback Plan

If something goes wrong:
- [ ] Know how to rollback in Vercel
- [ ] Have previous deployment URL saved
- [ ] Can quickly revert environment variables

## Go-Live Checklist

Final checks before announcing:
- [ ] All tests passed
- [ ] Team reviewed
- [ ] Backup plan ready
- [ ] Monitoring active
- [ ] Support ready
- [ ] Documentation updated

## Post-Launch

### Week 1
- [ ] Monitor errors daily
- [ ] Check analytics
- [ ] Gather user feedback
- [ ] Fix critical bugs

### Month 1
- [ ] Review performance
- [ ] Optimize slow pages
- [ ] Implement feedback
- [ ] Plan improvements

## Notes

**Deployment Date:** _______________
**Deployment URL:** _______________
**Issues Found:** _______________
**Resolution:** _______________

---

## Quick Reference Commands

```bash
# Local development
npm install
npm run dev

# Build and test
npm run build
npm start

# Deploy via CLI
vercel
vercel --prod

# Check logs
vercel logs [deployment-url]
```

## Support Contacts

- Vercel Support: https://vercel.com/support
- Next.js Discord: https://nextjs.org/discord
- Supabase Support: https://supabase.com/support

---

✅ **All items checked?** You're ready to go live! 🎉
