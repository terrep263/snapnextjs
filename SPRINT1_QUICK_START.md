# Sprint 1: Quick Start Guide

## 🚀 Quick Deployment (5 minutes)

### Step 1: Run Database Migration
```sql
-- Copy migrations/sprint1_database_foundation.sql into Supabase SQL Editor
-- Click "Run" to execute
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Verify Environment Variables
```bash
# Check these are set:
echo $DATABASE_URL
echo $STRIPE_SECRET_KEY
echo $STRIPE_WEBHOOK_SECRET
```

### Step 4: Test Health Endpoint
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"healthy",...}
```

### Step 5: Test Webhook (Optional)
```bash
# Install Stripe CLI if needed
stripe listen --forward-to localhost:3000/api/stripe-webhook

# In another terminal:
stripe trigger checkout.session.completed
```

## ✅ Verification Checklist

- [ ] Database migration executed successfully
- [ ] `npm install` completed without errors
- [ ] Health endpoint returns 200
- [ ] webhook_logs table exists
- [ ] error_logs table exists
- [ ] events table has new columns

## 🔍 Quick Debugging

### Check if tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('webhook_logs', 'error_logs');
```

### Check events table columns:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('payment_status', 'last_webhook_received');
```

### View recent webhooks:
```sql
SELECT stripe_event_id, webhook_type, processed, created_at 
FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

## 📞 Support

If issues occur:
1. Check `SPRINT1_IMPLEMENTATION.md` for detailed docs
2. Review error_logs table for errors
3. Check webhook_logs for failed webhooks
4. Verify environment variables are set correctly



