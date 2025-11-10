# Download System - How It Works

## User Flow

### Option 1: Download All (Green Button)
```
User clicks "Download All ({total items})"
    ↓
handleBulkDownload(allItems) called with ALL items
    ↓
Items sent to /api/bulk-download endpoint
    ↓
Server creates ZIP with all items
    ↓
ZIP downloads to user's computer
```

**No selection needed - automatic!**

### Option 2: Select & Download (Blue Button)
```
User clicks "Select & Download"
    ↓
Selection Mode activated (shows checkboxes on items)
    ↓
User clicks checkboxes to select specific items
    ↓
User clicks "Download (X)" button
    ↓
handleBulkDownload() called with SELECTED items only
    ↓
Only selected items sent to /api/bulk-download
    ↓
Server creates ZIP with selected items
    ↓
ZIP downloads to user's computer
```

**Can select as many or as few items as desired**

## Implementation Details

### Function: handleBulkDownload()
Located in: `src/components/SimpleEventGallery.tsx`

```typescript
const handleBulkDownload = async (itemsToDownload?: typeof allItems) => {
  // itemsToDownload: Optional array of items
  // If provided: use these items
  // If not provided: use selectedItems (filtered from allItems)
  
  const itemsForDownload = itemsToDownload && itemsToDownload.length > 0
    ? itemsToDownload              // Use provided items (Download All case)
    : allItems.filter(...)         // Use selected items (Select & Download case)
  
  // Validate count and size
  // Send to /api/bulk-download
  // Handle response and trigger download
}
```

### API Endpoint: /api/bulk-download
Located in: `src/app/api/bulk-download/route.ts`

Flow:
1. Receives array of items with URLs
2. For each item:
   - Calls `/api/download` proxy to fetch file
   - Adds file to ZIP archive
3. Returns ZIP as streaming response

### API Endpoint: /api/download (Proxy)
Located in: `src/app/api/download/route.ts`

Purpose:
- Handles CORS issues with Supabase storage
- Fetches files server-side (more reliable)
- Returns blob to `/api/bulk-download`

## UI Components

### Navigation Sidebar
- **Download All Button** (Green)
  - Always visible
  - Bypasses selection mode
  - Downloads entire gallery

- **Select & Download Button** (Blue)
  - Activates selection mode
  - Shows checkboxes on items
  - Allows selective download

- **Select All / Clear Buttons**
  - Only visible in selection mode
  - Quick way to select/deselect everything

- **Download (X) Button**
  - Only visible in selection mode
  - Shows count of selected items
  - Disabled if nothing selected

## Key Features

✅ **No Selection Required for Download All**
- Green button downloads entire gallery in one click

✅ **Flexible Selection Mode**
- Toggle on/off to switch between modes
- Select any combination of items

✅ **Automatic File Organization**
- Files named with titles or IDs
- All packaged in single ZIP
- Named after event

✅ **Error Handling**
- Validates file count (max 1000)
- Checks ZIP size limits
- Handles network timeouts
- Alerts user on failure

✅ **Progress Tracking**
- Server logs each file download
- Reports success/failure to client
- Shows file size of final ZIP

## Testing

Test on: https://snapworxx.com/e/steve-s-2025-birthday-qwf1e2

**Test Case 1: Download All**
1. Click green "Download All" button
2. Verify ZIP downloads with all items
3. Check ZIP contains all files

**Test Case 2: Select & Download**
1. Click blue "Select & Download" button
2. Click checkboxes to select 5 items
3. Click "Download (5)" button
4. Verify ZIP contains exactly 5 items

**Test Case 3: Select All**
1. Click blue "Select & Download" button
2. Click "All (X)" button to select all
3. Click "Download (X)" button
4. Verify ZIP contains all items

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Green button doesn't work | Clear browser cache, reload page |
| Download starts but never finishes | Check network timeout, smaller selection |
| ZIP file is empty | Check if items have valid URLs |
| "Too many files" error | Select fewer items (max 1000) |
| Download fails with error | Check browser console for details |
