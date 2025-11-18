# ZIP Download Build Fix - November 17, 2025

## Problem
The bulk download ZIP operation was not working correctly in the deployed build:
- ZIP files were empty or corrupted
- Archive stream was not properly finalized
- Streaming API incompatibility with serverless environment

## Root Cause
The `/api/bulk-download` route was using:
1. **TransformStream** - Web Streams API that doesn't work well with Node.js `archiver` library
2. **Async background processing** - Archive was returned before completion
3. **No runtime specification** - May have been running in Edge runtime where Node.js streams don't work

## Solution Applied

### 1. Force Node.js Runtime
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```
- Ensures route runs in Node.js environment
- Provides full access to Node.js streams and archiver functionality

### 2. Synchronous Buffer Collection
**Before:**
```typescript
const { readable, writable } = new TransformStream();
archive.pipe(writable as any);
// Returns stream immediately (incomplete)
return new NextResponse(readable as any, { ... });
```

**After:**
```typescript
const chunks: Buffer[] = [];
const bufferStream = new Writable({
  write(chunk, encoding, callback) {
    chunks.push(Buffer.from(chunk));
    callback();
  }
});
archive.pipe(bufferStream);

// Wait for archive to finalize
await archive.finalize();

// Wait for all data to be written
await new Promise<void>((resolve, reject) => {
  bufferStream.on('finish', () => resolve());
  bufferStream.on('error', reject);
});

// Combine and return complete buffer
const zipBuffer = Buffer.concat(chunks);
return new NextResponse(zipBuffer, { ... });
```

### 3. Direct File Downloads
Changed from proxying through `/api/download` to direct URL fetches:
```typescript
async function downloadFileWithTimeout(url: string): Promise<Buffer> {
  const response = await fetch(url.startsWith('http') ? url : 
    `${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}${url}`);
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

### 4. Added Content-Length Header
```typescript
return new NextResponse(zipBuffer, {
  headers: {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${filename}.zip"`,
    'Content-Length': zipBuffer.length.toString(), // ← ADDED
  },
});
```

## Benefits

✅ **Complete ZIP Files**: Archive is fully created before sending
✅ **Proper Finalization**: All data is written and flushed
✅ **Node.js Compatibility**: Uses proper Node.js streams with archiver
✅ **Progress Tracking**: Still logs progress during creation
✅ **Error Handling**: Continues on individual file failures
✅ **Size Limits**: Enforces per-file and total size limits

## Testing

Test the fix by:

1. **Download All Items**: Click green "Download All" button
   - Should create complete ZIP with all gallery items
   - ZIP should extract without errors

2. **Download Selected Items**: Select specific items and download
   - Should create ZIP with only selected items
   - All files should be present and intact

3. **Large Downloads**: Test with 10+ items
   - Should handle multiple files correctly
   - Progress should be logged in console

4. **Check ZIP Contents**:
   ```
   - All expected files present
   - Files are not corrupted
   - Proper filenames
   - No empty files
   ```

## Files Modified

- `src/app/api/bulk-download/route.ts` - Complete rewrite for proper ZIP creation

## Deployment Notes

When deploying:
1. Build will use Node.js runtime for this route
2. Route will be deployed as serverless function (not edge)
3. May have longer cold start time but ensures reliability
4. Memory usage will be higher but acceptable for ZIP operations

## Future Improvements

Consider for later:
- [ ] Stream larger files directly from Supabase to ZIP
- [ ] Add progress streaming via Server-Sent Events
- [ ] Implement chunked ZIP creation for very large galleries
- [ ] Add ZIP file caching for frequently downloaded galleries
