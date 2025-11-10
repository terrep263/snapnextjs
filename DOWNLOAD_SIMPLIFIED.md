# Download System - SIMPLIFIED

## Two Simple Functions

### 1. Download All Items (GREEN BUTTON)
```
User clicks GREEN "Download All" button
    ↓
downloadAllItems() function runs
    ↓
Bundles ALL items in gallery into ZIP
    ↓
Downloads to user computer
    ↓
No selection needed, works immediately
```

**Code:** `downloadAllItems()` in `src/components/SimpleEventGallery.tsx`

### 2. Select & Download Items (BLUE BUTTON)
```
User clicks BLUE "Select Items to Download" button
    ↓
selectMode = true
    ↓
Checkboxes appear on gallery items
    ↓
User clicks checkboxes to select items
    ↓
Click "Download (X) Selected" button
    ↓
downloadSelectedItems() function runs
    ↓
Bundles ONLY selected items into ZIP
    ↓
Downloads to user computer
```

**Code:** `downloadSelectedItems()` in `src/components/SimpleEventGallery.tsx`

## UI Layout (Navigation Sidebar)

```
┌─────────────────────────────────┐
│  DOWNLOAD CONTROLS              │
├─────────────────────────────────┤
│                                 │
│  [🔽 Download All (45)]        │ ← GREEN BUTTON
│    Downloads everything         │
│                                 │
│  [✓ Select Items to Download]  │ ← BLUE BUTTON
│    Toggle selection mode        │
│                                 │
│  When in select mode:           │
│  - [✓ Select All (45)] [Clear] │
│  - [🔽 Download (X) Selected]  │
│  - [Cancel Selection]           │
│                                 │
└─────────────────────────────────┘
```

## State Management (SIMPLIFIED)

- `selectMode` - Boolean: Is selection mode active?
- `selectedItems` - Set: Which items are checked?
- `downloading` - Boolean: Is download in progress?

**Removed:** `bulkMode` state (was over-complicating things)

## Function Flow

### downloadAllItems()
1. Check if gallery has items
2. Send ALL items to `/api/bulk-download`
3. Receive ZIP blob
4. Trigger browser download
5. Disable button while downloading

### downloadSelectedItems()
1. Filter allItems by selectedItems Set
2. Check if any items selected
3. Send SELECTED items to `/api/bulk-download`
4. Receive ZIP blob
5. Trigger browser download
6. Exit select mode
7. Clear selections

## API Endpoint

Both functions call the same endpoint:
- **Path:** `POST /api/bulk-download`
- **Body:** `{ filename, items: [ {id, url, title}, ... ] }`
- **Response:** ZIP file as blob

## Key Improvements

✅ **Removed complexity** - No more `bulkMode` state switching
✅ **Separated concerns** - Two clear functions for two actions
✅ **Simple state** - Just `selectMode` boolean
✅ **Clear UI** - Both buttons visible at all times
✅ **No nested conditionals** - Straightforward button layout
