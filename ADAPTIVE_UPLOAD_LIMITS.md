# Adaptive Upload Limits - Implementation Guide

## Overview

The video upload limit has been transformed from a **hard 60MB limit** to an **intelligent, adaptive system** that adjusts based on file type, quality, and estimated duration.

**Key Principle**: No hard limits on user uploads, but intelligent guidance based on actual file characteristics.

---

## How It Works

### Smart Detection by File Type

The system analyzes uploaded files and provides appropriate limits:

#### **Videos**
- **Estimates bitrate** from file size
- **Detects quality level**: 4K, 1080p, 720p, 480p, or low quality
- **Calculates estimated duration**
- **Sets adaptive limits** based on detected quality

Examples:
- **4K video (50+ Mbps)**: Allows up to 2000MB (~60 min at 4K)
- **1080p video (12-17 Mbps)**: Allows up to 750MB (~75 min)
- **720p video (6-8 Mbps)**: Allows up to 600MB (~75 min)
- **480p video (2-4 Mbps)**: Allows up to 300MB

#### **Audio**
- **Estimates bitrate** (320k, 128k, 64k, etc.)
- **Calculates duration**
- **Allows up to 1000MB** (~180 min for medium quality)

#### **Images**
- **Simple size-based limits**
- Recommended: 50MB, Warning: 100MB, Hard limit: 200MB

### Three-Tier Limit System

```
├── Recommended Max (green zone)
│   └─ What we suggest as ideal
│
├── Warning Threshold (yellow zone)
│   └─ File is larger than recommended, but we'll try
│
└── Hard Limit (red zone)
    └─ File exceeds what we can accept, upload rejected
```

**Example for 1080p video:**
- Recommended: 300MB
- Warning threshold: 500MB
- Hard limit: 750MB

Users can upload up to 750MB, but get warnings at 500MB to help them understand the file size.

---

## Configuration

### Global Hard Limit
Located in `src/components/PhotoUpload.tsx`:

```typescript
const [globalMaxFileSizeMB, setGlobalMaxFileSizeMB] = useState(
  AdaptiveUploadLimits.getGlobalHardLimit()  // Default: 2000MB
);
```

**User can adjust via settings dropdown:**
- 500MB (Most videos) ← Default recommended
- 1000MB (Large files)
- 1500MB (4K content)
- 2000MB (Maximum allowed)

### Adaptive Limits Per File

Each file gets its own analysis and limits in `src/lib/adaptiveUploadLimits.ts`:

```typescript
const adaptiveConfig = AdaptiveUploadLimits.getAdaptiveLimits(file);
// Returns:
// {
//   recommendedMaxMB: 300,
//   warningThresholdMB: 500,
//   allowedMaxMB: 750,
//   estimatedDurationMinutes: 30,
//   reason: "Video detected (1080p FHD, ~17 Mbps, estimated 30 min)"
// }
```

---

## What Changed from Old System

| Aspect | Old System | New System |
|--------|-----------|-----------|
| **Limit Type** | Hard 60MB | Adaptive per file |
| **Consideration** | Phones only | All sources (phone, camera, desktop, web) |
| **Duration Factor** | 3-minute assumption | Estimated from file size |
| **Quality Detection** | Basic | Bitrate-based analysis |
| **4K Support** | No (blocked) | Yes (up to 2GB) |
| **User Flexibility** | Strict | Warnings + hard limits |
| **Video Types** | Smartphone only | Any quality/source |

---

## Technical Details

### Bitrate Estimation Algorithm

For **video**, we estimate bitrate by assuming average video duration:

```
Estimated Bitrate (Mbps) = File Size (MB) × 0.0133

This assumes ~10 minute average video
If detected bitrate ≥40 Mbps → Likely 4K
If detected bitrate ≥12 Mbps → Likely 1080p
If detected bitrate ≥6 Mbps → Likely 720p
If detected bitrate ≥2 Mbps → Likely 480p or lower
```

Then we calculate actual estimated duration:

```
Duration (minutes) = File Size (MB) / (Bitrate (Mbps) × 0.488)
```

### Quality Detection

The system maps detected bitrates to likely video qualities:

```typescript
static readonly BITRATES = {
  video: {
    '4K': 50,      // 4K/UHD
    '1080p': 17,   // 1080p FHD (common)
    '720p': 8,     // 720p HD
    '480p': 4,     // 480p (compressed)
    'low': 2       // Very low quality
  }
};
```

---

## User Interface

### Status Indicators

When user selects a file, they see:

```
✅ Accepted (green)     - File is within recommended size
⚠️  Warning (yellow)    - File is large, but we'll try
❌ Rejected (red)       - File exceeds hard limit
```

### Advanced Settings

Users can control global limits via **Advanced Options** → **Global Hard Limit** dropdown.

### Automatic Suggestions

Based on detected file type:
- **Videos**: Show estimated duration and bitrate
- **Audio**: Show estimated duration and bitrate
- **Images**: Show resolution estimate

---

## Code Usage

### Getting Adaptive Limits

```typescript
import { AdaptiveUploadLimits } from '@/lib/adaptiveUploadLimits';

const file = selectedFile;
const config = AdaptiveUploadLimits.getAdaptiveLimits(file);

// config contains:
// - recommendedMaxMB
// - warningThresholdMB
// - allowedMaxMB
// - estimatedDurationMinutes
// - reason (human readable)
```

### Checking Upload Status

```typescript
const status = AdaptiveUploadLimits.getUploadStatus(config, fileSizeMB);
// Returns: 'accepted' | 'warning' | 'rejected'

const message = AdaptiveUploadLimits.getWarningMessage(config, fileSizeMB);
// Returns: User-friendly warning message
```

### Getting Warning Messages

```typescript
if (status === 'warning') {
  console.log(AdaptiveUploadLimits.getWarningMessage(config, fileSizeMB));
  // Output: "File is larger than recommended (300MB). Upload may be slow..."
}
```

---

## Limits by File Type (Current Defaults)

### Video
| Quality | Recommended | Warning | Hard Limit | Est. Duration |
|---------|-------------|---------|-----------|-----------------|
| 4K | 1000MB | 1500MB | 2000MB | 60+ min |
| 1080p | 300MB | 500MB | 750MB | 75 min |
| 720p | 200MB | 400MB | 600MB | 75 min |
| 480p | 100MB | 200MB | 300MB | - |

### Audio
| Quality | Recommended | Warning | Hard Limit | Est. Duration |
|---------|-------------|---------|-----------|-----------------|
| All | 500MB | 800MB | 1000MB | 180+ min |

### Images
| - | Recommended | Warning | Hard Limit |
|---|-------------|---------|-----------|
| All | 50MB | 100MB | 200MB |

---

## Benefits

✅ **No more frustration** - Users can upload videos from any source (phone, camera, desktop)
✅ **Smart guidance** - System explains why files are large
✅ **Flexible limits** - Different limits for different qualities/sources
✅ **Duration-aware** - Considers estimated video duration, not just file size
✅ **Future-proof** - Easy to adjust for 4K, 8K, or new formats
✅ **User-configurable** - Global hard limit can be adjusted in settings
✅ **Non-blocking** - Warnings don't prevent uploads unless truly excessive

---

## Future Enhancements

Possible improvements:

1. **Video codec detection** - Adjust limits based on H.264, H.265, VP9, etc.
2. **Resolution parsing** - Read actual video metadata instead of estimating
3. **Frame rate detection** - 24fps vs 60fps impacts file size
4. **Compression suggestion** - Recommend specific compression settings
5. **Per-event limits** - Different limits for different event types
6. **Bandwidth-aware** - Adjust timeouts based on connection speed
7. **Preview generation** - Show users what their video quality will be

---

## Troubleshooting

### "File too large" error on smaller file

**Cause**: File's bitrate is higher than expected (very high quality encoding)

**Solution**: User can:
1. Re-encode video with lower bitrate
2. Request higher global limit in settings
3. Use lower resolution

### Estimated duration seems wrong

**Cause**: Bitrate estimation is approximate, doesn't account for variable bitrate

**Solution**: This is a best-guess estimation. Actual duration may vary.

### Compression not helping enough

**Cause**: File already compressed or compression settings limited

**Solution**: Recommend manual re-encoding with tool like FFmpeg or Handbrake

---

## Files Modified

1. **Created**: `src/lib/adaptiveUploadLimits.ts` (295 lines)
   - Core adaptive limit logic
   - Bitrate estimation algorithms
   - Quality detection

2. **Modified**: `src/components/PhotoUpload.tsx`
   - Integrated adaptive limits
   - Updated UI to show adaptive information
   - Replaced hard-coded 60MB with intelligent system

---

## Testing Recommendations

1. **Test 1080p video** - Should allow ~300-750MB
2. **Test 720p video** - Should allow ~200-600MB
3. **Test 4K video** - Should allow up to 2000MB
4. **Test audio file** - Should allow up to 1000MB
5. **Test large image** - Should stay within 50-200MB range
6. **Adjust global limit** - Verify min/max enforcement
7. **Test compression flow** - Ensure compression still works with new system

---

## References

- `src/lib/adaptiveUploadLimits.ts` - Main implementation
- `src/components/PhotoUpload.tsx` - UI integration (lines 23-35, 102-148, 540-541, 580-595, 720-743)
- Video codecs reference: https://en.wikipedia.org/wiki/Video_codec
- Bitrate examples: https://support.google.com/youtube/answer/1722171

**Last Updated**: November 5, 2025  
**Status**: ✅ Implemented and deployed
