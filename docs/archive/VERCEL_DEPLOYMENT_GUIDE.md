# Vercel Deployment Guide for SnapNextJS

## 🚀 Pre-Deployment Checklist

✅ **Build Status**: Project builds successfully  
✅ **Dependencies**: All packages installed  
✅ **Stripe API**: Version updated to 2025-10-29.clover  
✅ **Environment Variables**: Template ready  

## 📝 Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from Project Directory
```bash
# Navigate to project (if not already there)
cd "c:\Users\terre\Downloads\snapworxx\nextjs\snapnextjs"

# Deploy to Vercel
vercel --prod
```

## 🔧 Environment Variables Setup

After deployment, you'll need to configure these environment variables in your Vercel dashboard:

### Required Environment Variables:
```
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
RESEND_API_KEY=your_resend_api_key
```

### How to Add Environment Variables:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable listed above

## 🔄 Alternative: GitHub Integration

### Option 1: Deploy via GitHub (Recommended)
1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. Connect GitHub to Vercel:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **"Add New Project"**
   - Select **"Import Git Repository"**
   - Choose your GitHub repository
   - Configure environment variables
   - Deploy

### Option 2: Direct CLI Deployment
```bash
# From project directory
vercel --prod
```

## 🛠️ Post-Deployment Configuration

### 1. Update Supabase CORS Settings
In your Supabase dashboard, add your Vercel domain to allowed origins:
- Go to **Settings** → **API**
- Add `https://your-app-name.vercel.app` to CORS origins

### 2. Update Stripe Webhook URLs
In your Stripe dashboard:
- Go to **Developers** → **Webhooks**
- Update endpoint URL to: `https://your-app-name.vercel.app/api/stripe-webhook`

### 3. Test Your Deployment
1. Visit your deployed app
2. Test photo upload functionality
3. Verify gallery displays correctly
4. Test payment flow (if applicable)

## 🚨 Troubleshooting

### Common Issues:
- **Build Failures**: Check TypeScript errors in build logs
- **Environment Variables**: Ensure all required vars are set
- **CORS Errors**: Update Supabase CORS settings
- **Function Timeouts**: API routes configured for 30s max duration

### Build Command Issues:
If you encounter build issues, you can override the build command:
```bash
vercel --build-env NODE_ENV=production
```

## 📊 Monitoring

After deployment:
- Monitor function logs in Vercel dashboard
- Check error reporting for any issues
- Verify all features work in production environment

---

**Ready to deploy!** Run `vercel --prod` when you're ready to go live. 🎉