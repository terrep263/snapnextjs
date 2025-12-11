# Server Error Diagnostic Guide

## Getting More Information

To help diagnose the server error, please provide:

1. **Exact error message** from:
   - Browser console (F12 → Console tab)
   - Terminal/command prompt running `npm run dev`
   - Network tab (F12 → Network → check failed requests)

2. **When does it occur?**
   - On page load?
   - When uploading a file?
   - When viewing the gallery?
   - Other action?

3. **Error details:**
   - Status code (e.g., 500, 404, 400)
   - Error message text
   - Stack trace (if available)

## Common Server Errors

### 1. Upload API Errors
**Symptoms:** Upload fails, 500 error
**Check:**
- Supabase credentials in `.env.local`
- Storage bucket exists and is public
- File size limits (25MB photos, 500MB videos)
- Database columns exist (run `verify_schema.sql`)

### 2. Database Errors
**Symptoms:** "Column not found" or "Table not found"
**Fix:** Run `verify_schema.sql` in Supabase SQL Editor

### 3. Import/Module Errors
**Symptoms:** "Cannot find module" or "Module not found"
**Fix:** 
```bash
npm install
npm run dev
```

### 4. Build Cache Issues
**Symptoms:** Old code running, type errors
**Fix:**
```bash
# Stop dev server (Ctrl+C)
rm -rf .next
npm run dev
```

## Quick Checks

1. **Check terminal output** - Look for red error messages
2. **Check browser console** - F12 → Console tab
3. **Check network requests** - F12 → Network tab → look for failed requests
4. **Check environment variables** - Ensure `.env.local` has all required vars

## Next Steps

Please share:
- The exact error message
- Where it appears (browser console, terminal, etc.)
- What action triggers it

This will help identify and fix the issue quickly.

