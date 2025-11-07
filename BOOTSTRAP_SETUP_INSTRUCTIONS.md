# Bootstrap Admin Setup Instructions

## Problem
The bootstrap page is showing "Bootstrap not configured" error because the `ADMIN_BOOTSTRAP_CODE` environment variable is not set in Vercel production.

## Solution: Add Environment Variable to Vercel

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com
2. Go to your snapworxx project
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add the Bootstrap Code
1. Click **Add New** button
2. Fill in:
   - **Name:** `ADMIN_BOOTSTRAP_CODE`
   - **Value:** `SNAPWORXX_BOOTSTRAP_2025_INITIAL_SETUP`
   - **Environments:** Select all (Development, Preview, Production)
3. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **...** menu and select **Redeploy**
4. Wait for deployment to complete (watch the build logs)

### Step 4: Test Bootstrap
Once deployed, visit: https://snapworxx.com/admin/bootstrap
- Enter code: `SNAPWORXX_BOOTSTRAP_2025_INITIAL_SETUP`
- Click **Verify Code**
- If successful, proceed to create your admin account

## Alternative: Use Existing Admin Login

If you want to skip bootstrap for now, you can use the existing hardcoded admin credentials:

**Email:** admin@snapworxx.com  
**Password:** snapworxx123

Visit: https://snapworxx.com/admin/login

## Permanent Setup (After Bootstrap)

Once you create the first super admin via bootstrap:
1. Delete the `ADMIN_CREDENTIALS` from Vercel environment variables
2. All future admins will be managed through the database
3. The bootstrap page will be one-time use only
