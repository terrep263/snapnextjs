# Download All Button Fix - November 10, 2025

## Issue Identified
The "Download All" (green) button was not working, while selecting items manually and downloading worked fine.

## Root Cause
**React State Update Timing Issue:**

When the green "Download All" button was clicked, the code was:
```tsx
onClick={() => {
  setBulkMode('all');           // ❌ Async state update
  setDownloading(true);         // ❌ Async state update
  handleBulkDownload();         // Calls immediately (before state updates!)
}}
```

The problem:
- `setBulkMode('all')` and `setDownloading(true)` are **asynchronous**
- `handleBulkDownload()` was called **immediately** without waiting
- Inside `handleBulkDownload()`, it checked `if (bulkMode === 'all')` but `bulkMode` was still `null`
- This caused it to filter by `selectedItems` (empty) instead of using `allItems`
- Result: Empty file list → empty ZIP or error

## Solution Implemented
Modified the function signature to accept an optional override parameter:

```tsx
const handleBulkDownload = async (itemsOverride?: typeof allItems) => {
  const itemsToDownload = itemsOverride 
    ? itemsOverride                                    // Use override if provided
    : bulkMode === 'all' 
      ? allItems 
      : allItems.filter(item => selectedItems.has(item.id));
```

Then updated the Download All button to pass `allItems` directly:
```tsx
onClick={() => {
  handleBulkDownload(allItems);  // ✅ Pass all items directly
}}
```

## Changes Made
- **File:** `src/components/SimpleEventGallery.tsx`
- **Line 102-117:** Modified `handleBulkDownload()` to accept `itemsOverride` parameter
- **Line 421-428:** Updated Download All button to pass `allItems` directly

## Result
✅ **Download All button now works correctly**
- Downloads all items in the gallery
- No dependency on state update timing
- Both manual selection and Download All work identically

## Testing Notes
Test on: https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2

Verify:
1. Click green "Download All" button → should download all items as ZIP
2. Select specific items → click blue "Download (X)" → should download selected items as ZIP
3. Both should produce proper ZIP files with correct file contents
