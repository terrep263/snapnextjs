# SnapWorxx Setup Guide

## 🚀 Quick Setup Instructions

### 1. Environment Variables
Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
- **Supabase**: Project URL and API keys from your Supabase dashboard
- **Stripe**: Test API keys from your Stripe dashboard  
- **Resend**: API key from your Resend dashboard

### 2. Supabase Database Setup

#### Step 1: Create Tables
1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `database_schema.sql`
4. Click "Run" to create all tables and policies

#### Step 2: Create Storage Bucket
1. Go to "Storage" in your Supabase dashboard
2. Click "Create Bucket"
3. Name: `photos`
4. Public bucket: **Yes** ✅
5. Click "Create Bucket"

OR run this SQL command in the SQL Editor:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;
```

#### Step 3: Set Storage Policies
Run these commands in the SQL Editor to allow photo uploads:

```sql
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'photos');

-- Allow uploads
CREATE POLICY "Anyone can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');

-- Allow deletions (optional)
CREATE POLICY "Anyone can delete photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos');
```

### 3. Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Get your test API keys from the Stripe dashboard
3. Add them to your `.env.local` file
4. For production, replace with live keys

### 4. Resend Setup (Optional - for emails)
1. Create account at https://resend.com
2. Get your API key
3. Add to `.env.local`
4. Verify your sending domain if needed

## 🧪 Testing Your Setup

### Development Mode
The app includes mock/fallback modes for testing:

- **Photo Upload**: Works with simulated uploads if Supabase isn't configured
- **Payment**: Shows mock checkout if Stripe isn't configured
- **Email**: Logs to console if Resend isn't configured

### Verify Everything Works
1. Start the development server: `npm run dev`
2. Visit http://localhost:3000 (or 3001 if port 3000 is busy)
3. Use the temporary navigation menu to test all pages
4. Try creating an event and uploading photos

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── page.tsx        # Home page
│   ├── create/         # Event creation
│   ├── success/        # Payment success
│   ├── dashboard/[id]/ # Event management
│   ├── e/[slug]/      # Public photo gallery
│   └── api/           # API endpoints
├── components/         # Reusable components
│   ├── MasonryGallery.tsx    # Photo grid display
│   ├── PhotoUpload.tsx       # File upload component
│   ├── QRCodeGenerator.tsx   # QR code generation
│   └── TempNavigation.tsx    # Development navigation
└── lib/
    └── supabase.ts    # Database client
```

## 🔧 Common Issues & Solutions

### "Images not loading"
- Check that `images.unsplash.com` is in your `next.config.js`
- Verify Supabase storage bucket is public
- Check browser console for CORS errors

### "Upload not working"
- Verify Supabase storage bucket exists and is named 'photos'
- Check storage policies allow uploads
- Make sure `.env.local` has correct Supabase keys

### "Payment failing"
- Verify Stripe test keys are correct
- Check Stripe webhook URL is configured
- Use test card numbers from Stripe docs

### "QR codes not generating"
- Install missing dependencies: `npm install qrcode`
- Check that event URLs are valid
- Verify browser supports canvas for QR generation

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
Make sure to:
- Add all environment variables
- Set Node.js version to 18+
- Configure build command: `npm run build`
- Set output directory to `.next`

## 📞 Support

If you run into issues:
1. Check the browser console for errors
2. Review the setup steps above
3. Verify all environment variables are set correctly
4. Test each service (Supabase, Stripe, Resend) individually

Happy building! 🎉