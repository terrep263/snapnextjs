# 🚀 QUICK START - Fix Upload Error NOW

**Time needed:** 5 minutes
**What you'll do:** Run one SQL script in Supabase

---

## ⚡ THE FASTEST WAY TO FIX UPLOADS

### OPTION 1: Just Fix It (2 minutes) ✅

1. **Open Supabase:**
   - Go to https://supabase.com/dashboard
   - Sign in
   - Select your project
   - Click **SQL Editor**

2. **Run the fix:**
   - Click **"+ New query"**
   - Open `FIX_UPLOAD_ERROR.sql` from your project
   - Copy **ALL** content
   - Paste into Supabase
   - Click **"Run"**

3. **Done!**
   - You'll see "✅ UPLOAD FIX COMPLETE!"
   - Go test an upload
   - It should work now ✅

---

## 🎯 WHAT IF IT DOESN'T WORK?

### Check Environment Variables (3 minutes)

**Do you have a `.env.local` file?**
- NO → Copy `.env.local.example` to `.env.local`
- YES → Check it has these values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

**Where to get these:**
1. Supabase Dashboard → Settings → API
2. Copy the values
3. Paste into your `.env.local` file
4. Restart your app: `npm run dev`

---

## ✅ SUCCESS CHECKLIST

After running the SQL script:

- [ ] No errors in Supabase SQL Editor
- [ ] See success message with checkmarks
- [ ] Supabase Storage shows "photos" bucket
- [ ] Test upload works
- [ ] File appears in your event gallery

**All checked?** You're done! 🎉

---

## 📚 MORE HELP?

- **Detailed guide:** Read `UPLOAD_ERROR_FIX_GUIDE.md`
- **Still stuck:** Check troubleshooting section in guide
- **Environment setup:** See `.env.local.example`

---

## 🎓 WHAT THIS FIXES

The AI made Supabase policy changes that were too restrictive. This script:
- ✅ Updates storage bucket policies
- ✅ Fixes the RLS UPDATE clause (the key issue)
- ✅ Sets up database tables properly
- ✅ Allows all upload methods to work

**Technical:** The fix adds `WITH CHECK` to the UPDATE policy, which is required for chunked uploads.

---

## 💡 TIP FOR NON-CODERS

You don't need to understand the code! Just:
1. Copy the SQL file content
2. Paste it into Supabase
3. Click Run
4. That's it!

The system handles everything else automatically.

---

**Last Updated:** November 5, 2025
**Status:** Ready to use
**Next:** Run `FIX_UPLOAD_ERROR.sql` in Supabase → Test upload
