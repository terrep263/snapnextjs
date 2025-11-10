# Testing 101-Item Gallery Download

**Event:** https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2  
**Total Items:** 101 (Header + Profile + 99 photos/videos)

---

## Expected Performance

### Green Button - Download All (101 items)

**Expected Behavior:**
- Click GREEN button
- ZIP begins creating immediately
- Download starts within 10-30 seconds
- Final file size: ~500MB - 1GB (depending on photo resolution)
- All 101 items included in ZIP

**Console Output Should Show:**
```
🔄 Download All: Starting bulk download of 101 items
📦 Downloading: 1/101 - Event Header
📦 Downloading: 2/101 - Event Profile
📦 Downloading: 3/101 - Photo 1
📦 Downloading: 4/101 - Photo 2
...
📦 Downloading: 101/101 - Photo 99
✅ Download All completed: 450.25MB
```

**Timeline:**
- 0-5 seconds: Initial request sent to server
- 5-30+ seconds: Server downloads all 101 items
  - ~300ms per item (30s timeout, 100ms delay)
  - 101 items × 300ms ≈ 30 seconds minimum
- 30-40 seconds: ZIP compression and streaming
- 40+ seconds: File completes download to computer

### Blue Button - Select Some (e.g., 10 items)

**Expected Behavior:**
- Click BLUE button
- Select 10 items via checkboxes
- Click "Download (10) Selected"
- ZIP begins creating with only 10 items
- Download much faster than Download All

**Expected Timeline:**
- 0-5 seconds: Initial request
- 5-10 seconds: Download 10 items (~100ms each)
- 10-15 seconds: ZIP compression
- 15-20 seconds: File completes

---

## Configuration for 101 Items

Current settings are optimized:

```typescript
FETCH_TIMEOUT = 30000      // 30 seconds per file (plenty for 101 items)
REQUEST_DELAY = 100        // 100ms between requests (prevents rate limiting)
MAX_FILE_SIZE = 100MB      // Per file limit (safe for photos/videos)
MAX_TOTAL_SIZE = 500MB     // Total ZIP limit (should handle 101 items)
```

**Calculation:**
- 101 items × average file size
- If average ~5MB per item = ~505MB
- If average ~4MB per item = ~404MB (safe)
- With compression: likely 300-400MB final

---

## Potential Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Download takes >60s | Network slow or server under load | Normal for 101 items, wait longer |
| "Total size exceeds 500MB" | Files too large | Select fewer items or reduce quality |
| Download stops at 50% | Timeout during processing | Try selecting fewer items first |
| ZIP file empty | All items failed | Check URLs are valid in console |
| ZIP missing items | Some files failed to download | Check console for 404 or timeout errors |

---

## Testing Steps

### Step 1: Test Green Button (Download All 101)
```
1. Open: https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2
2. Open browser console (F12)
3. Scroll to find GREEN button "Download All (101)"
4. Click it
5. Watch console for download progress
6. Wait 30-60 seconds for completion
7. File should download as event-gallery.zip
8. Check file size (should be 300-400MB+)
```

**Success Criteria:**
- ✓ Console shows "🔄 Download All: Starting bulk download of 101 items"
- ✓ Console logs download progress 1-101
- ✓ File downloads to computer
- ✓ File size > 100MB
- ✓ Console shows "✅ Download All completed: XXX.XXMB"
- ✓ ZIP extracts without errors

### Step 2: Test Blue Button (Select & Download)
```
1. Click BLUE button "Select Items to Download"
2. Checkboxes appear on gallery items
3. Scroll and select 5-10 items
4. Notice button now says "Download Selected (5)" or similar
5. Click "Download (X) Selected"
6. Wait 10-20 seconds
7. File downloads as event-gallery.zip
8. Check file size (should be smaller than full download)
```

**Success Criteria:**
- ✓ Checkboxes appear
- ✓ Selected count updates correctly
- ✓ Only selected items download
- ✓ File size proportional to selection
- ✓ ZIP extracts successfully

### Step 3: Verify File Contents
```
1. Extract downloaded ZIP
2. Count files (should match selected or 101)
3. Check files have proper names
4. Verify file types (jpg, mp4, etc)
5. Spot-check photos/videos are valid
```

---

## Server-Side Optimization

The system is optimized for large downloads:

**Streaming Architecture:**
- Files downloaded sequentially (not parallel)
- 100ms delay between requests prevents rate limiting
- ZIP created on-the-fly (not in memory)
- Streamed to client (not stored on server)

**Error Resilience:**
- Individual file failure doesn't stop entire download
- Failed files logged but process continues
- Only aborts if ALL files fail
- Timeouts handled gracefully

**Performance:**
- Archiver compression level 6 (good balance)
- Sequential processing keeps server load low
- Streaming reduces memory footprint

---

## Monitoring

### Watch Browser Console
```javascript
// Look for these patterns:
🔄 Download All: Starting...     // Start
📦 Downloading: X/101...          // Progress (every file)
✅ Download All completed...      // Success
❌ Download All failed...         // Error
```

### Watch Network Tab (F12 → Network)
```
- POST /api/bulk-download
- Status: 200 (success)
- Type: application/zip
- Size: Shows total KB
- Time: Shows total duration
```

### Check File Properties
```
- Filename: event-gallery.zip
- Size: 300-500MB (for 101 items)
- Type: application/zip
```

---

## Success Indicators

✅ **All 101 items download successfully**
✅ **ZIP file is 300MB+ (large enough for 101 items)**
✅ **No timeout errors**
✅ **No CORS errors**
✅ **No authentication errors**
✅ **Console shows progress 1-101**
✅ **File extracts without corruption**
✅ **Selected items work as expected**
✅ **System handles 101 items without issues**

---

## If Download Fails

### Debug Checklist:
- [ ] Check browser console (F12) for errors
- [ ] Look for 404 errors (bad URLs)
- [ ] Look for CORS errors (origin issues)
- [ ] Look for timeout errors (30s limit)
- [ ] Look for size errors (>500MB)
- [ ] Check network tab (F12 → Network)
- [ ] Try with fewer items first
- [ ] Clear browser cache and retry
- [ ] Try different browser
- [ ] Check server logs for errors

### Common Errors & Fixes:

**"Downloaded file is empty"**
- Means ZIP was created but has no files
- All 101 items probably failed to download
- Check URLs in console

**"HTTP 403: Forbidden"**
- Auth/permission issue with Supabase
- Check download proxy is working

**"Timeout downloading file"**
- File took >30 seconds to download
- Network or server issue
- Try again, or select fewer items

**"Total ZIP size exceeds 500MB"**
- Too many/too large files selected
- Select fewer items
- Or reduce number of items

---

## Expected Result

**Green Button (All 101):**
```
✅ ZIP file: event-gallery.zip
✅ Size: ~400MB (compressed)
✅ Contents: 101 files (header, profile, 99 items)
✅ Time: 30-60 seconds to complete
✅ Quality: Full resolution preserved
```

**Blue Button (Select 10):**
```
✅ ZIP file: event-gallery.zip
✅ Size: ~40MB (compressed, 10 items)
✅ Contents: 10 selected files
✅ Time: 10-20 seconds to complete
✅ Quality: Full resolution preserved
```

---

**Ready to test on 101-item gallery!** ✅
