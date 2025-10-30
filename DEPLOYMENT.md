# Deployment Guide for SnapWorxx Next.js

## Prerequisites

Before deploying, make sure you have:

1. ✅ Vercel account (free tier works)
2. ✅ GitHub repository with your code
3. ✅ Supabase project set up with:
   - Database tables created
   - Edge Functions deployed
   - Environment variables noted
4. ✅ Stripe account with publishable key

## Quick Deployment Steps

### 1. Prepare Your Environment Variables

You'll need these environment variables for Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select "Next.js" as the framework (should auto-detect)
4. Add environment variables in the deployment configuration
5. Click "Deploy"

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd /path/to/snapworxx-nextjs
vercel

# Follow the prompts to:
# - Link to existing project or create new
# - Set up environment variables
# - Deploy

# For production deployment
vercel --prod
```

#### Option C: Using the Vercel MCP Tool (If Available)

If you have the Vercel MCP tool configured, you can deploy directly from your development environment.

### 3. Configure Environment Variables in Vercel

After deployment:

1. Go to your project dashboard on Vercel
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - Variable name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Your Supabase URL
   - Environments: Production, Preview, Development
4. Repeat for all variables
5. Redeploy if needed

### 4. Update Supabase Allowed URLs

In your Supabase project:

1. Go to Authentication → URL Configuration
2. Add your Vercel domain to "Site URL"
3. Add to "Redirect URLs":
   - `https://your-app.vercel.app/success`
   - `https://your-domain.com/success` (if using custom domain)

### 5. Update Stripe Redirect URLs

In your Stripe Dashboard:

1. Go to your product settings
2. Update success/cancel URLs to point to your Vercel deployment:
   - Success URL: `https://your-app.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`
   - Cancel URL: `https://your-app.vercel.app/create`

## Post-Deployment Checklist

- [ ] Test home page loads correctly
- [ ] Test create event page with package selection
- [ ] Test Stripe checkout flow (use test mode)
- [ ] Verify success page redirects work
- [ ] Check that all images load properly
- [ ] Test on mobile devices
- [ ] Verify environment variables are set
- [ ] Check Vercel logs for any errors

## Custom Domain Setup (Optional)

1. Go to Project Settings → Domains in Vercel
2. Add your custom domain
3. Configure DNS records as shown
4. Wait for SSL certificate (automatic)
5. Update Supabase and Stripe URLs to use custom domain

## Monitoring

### Vercel Analytics

- Automatically enabled for all deployments
- View in Project → Analytics tab

### Error Tracking

Check deployment logs:
```bash
vercel logs [deployment-url]
```

Or view in Vercel dashboard → Deployments → [deployment] → Logs

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Common issues:
   - TypeScript errors: Fix in your code
   - Missing dependencies: Run `npm install` locally first
   - Environment variables: Ensure all required vars are set

### Runtime Errors

1. Check Function logs in Vercel
2. Verify environment variables are set correctly
3. Test API endpoints manually
4. Check Supabase connection

### Images Not Loading

1. Verify image paths in `public/` directory
2. Check `next.config.js` has correct remote patterns
3. Ensure images are committed to Git

## Rollback

If you need to rollback to a previous deployment:

1. Go to Vercel dashboard → Deployments
2. Find the working deployment
3. Click "..." → "Promote to Production"

## Environment-Specific Deployments

### Preview Deployments

- Automatically created for pull requests
- Use different environment variables if needed
- Test before merging to main

### Production

- Triggered by pushes to `main` branch
- Uses production environment variables
- Can be manually triggered in dashboard

## Performance Optimization

After deployment:

1. Enable Vercel Speed Insights
2. Monitor Core Web Vitals
3. Optimize images if needed
4. Enable ISR for dynamic pages if applicable

## Security

- Never commit `.env.local` file
- Use Vercel environment variables for secrets
- Keep dependencies updated
- Enable Vercel firewall rules if needed

## Support

If you encounter issues:

1. Check Vercel documentation: https://vercel.com/docs
2. Review Next.js deployment guide: https://nextjs.org/docs/deployment
3. Check Vercel community: https://github.com/vercel/vercel/discussions

## Next Steps After Deployment

1. Implement remaining pages:
   - Guest upload page (`/e/[slug]`)
   - Full dashboard page with gallery
2. Add proper error boundaries
3. Implement proper loading states
4. Add analytics tracking
5. Set up monitoring and alerts

---

Happy deploying! 🚀
