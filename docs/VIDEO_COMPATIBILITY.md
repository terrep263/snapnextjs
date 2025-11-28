# Video Compatibility & Android Video Support

This document explains how the gallery handles video compatibility, especially for videos from Android devices.

## 🎯 Problem: Android Videos on the Web

Android phones often create videos with codecs that aren't fully supported by web browsers:

- **H.265/HEVC** - High efficiency but limited browser support
- **Non-standard containers** - `.3gp`, `.mkv` files
- **High bitrates** - Can cause playback issues
- **Incompatible metadata** - Breaks some web players

## ✅ Solution: Automatic Detection & Transcoding

Our implementation provides **three layers of video handling**:

### 1. Client-Side Compatibility Detection

**Location:** `/src/lib/videoCompatibility.ts`

Automatically checks if uploaded videos will play in web browsers:

```typescript
import { checkVideoCompatibility } from '@/lib/videoCompatibility';

const info = await checkVideoCompatibility(file);
if (info.needsTranscoding) {
  // Offer to transcode
}
```

**Features:**
- Detects Android video formats
- Checks browser codec support
- Estimates if transcoding is needed
- No server round-trip required

### 2. Smart Upload Component

**Location:** `/src/components/VideoUploadWithTranscoding.tsx`

A drop-in replacement for file uploads with built-in compatibility checking:

```typescript
import VideoUploadWithTranscoding from '@/components/VideoUploadWithTranscoding';

<VideoUploadWithTranscoding
  onUpload={handleVideoUpload}
  maxSizeMB={500}
/>
```

**Features:**
- ✅ Automatic compatibility check on file selection
- ✅ Visual feedback (green = compatible, yellow = warning)
- ✅ One-click transcoding for incompatible videos
- ✅ Mobile-responsive design
- ✅ Progress indicators
- ✅ Android video detection

### 3. Server-Side Transcoding API

**Location:** `/src/app/api/transcode-video/route.ts`

Converts incompatible videos to web-compatible MP4:

```bash
POST /api/transcode-video
Content-Type: multipart/form-data

video: <File>
```

**Response:**
```
Content-Type: video/mp4
<transcoded video blob>
```

**Settings:**
- **Video Codec:** H.264 (universally supported)
- **Audio Codec:** AAC
- **Container:** MP4
- **Optimization:** Fast-start enabled (streaming)
- **Quality:** CRF 23 (high quality, reasonable size)

## 📱 Mobile Optimizations

### PhotoSwipe Lightbox (Mobile-First)

The gallery lightbox is optimized for mobile devices:

**Touch Gestures:**
- ✅ Swipe to navigate between images/videos
- ✅ Pinch to zoom (images only)
- ✅ Vertical drag to close
- ✅ Tap video to show/hide controls

**Performance:**
- ✅ Animations disabled on screens < 800px width
- ✅ Optimized preloading
- ✅ Body scroll lock when open
- ✅ Touch-action optimizations

**Video Controls:**
- ✅ Larger hit targets (48px minimum)
- ✅ Always visible on mobile
- ✅ Prevent double-tap zoom on videos
- ✅ iOS Safari compatibility fixes

### Mobile CSS Enhancements

**Location:** `/src/app/globals.css`

```css
@media (max-width: 768px) {
  .pswp__video {
    max-height: 80vh; /* More space for controls */
  }

  .pswp__button {
    width: 48px !important; /* Larger touch targets */
    height: 48px !important;
  }
}
```

## 🔧 Setup Requirements

### For Client-Side Only (No Transcoding)

**No setup needed!** The compatibility detection works out of the box.

### For Server-Side Transcoding

**Requires FFmpeg:**

```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Docker
FROM node:20
RUN apt-get update && apt-get install -y ffmpeg
```

**Check if available:**
```bash
GET /api/transcode-video
```

Response:
```json
{
  "available": true,
  "message": "Video transcoding is available"
}
```

## 📖 Usage Examples

### Basic Video Upload with Transcoding

```typescript
import VideoUploadWithTranscoding from '@/components/VideoUploadWithTranscoding';

function MyUploadPage() {
  const handleUpload = async (file: File) => {
    // Upload to your storage (Supabase, S3, etc.)
    const formData = new FormData();
    formData.append('file', file);

    await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  };

  return (
    <VideoUploadWithTranscoding
      onUpload={handleUpload}
      maxSizeMB={500}
    />
  );
}
```

### Manual Compatibility Check

```typescript
import { checkVideoCompatibility, estimateTranscodingNeed } from '@/lib/videoCompatibility';

// Quick estimate (synchronous)
const estimate = estimateTranscodingNeed(file);
if (estimate.needed) {
  console.log('Reasons:', estimate.reasons);
}

// Detailed check (async)
const info = await checkVideoCompatibility(file);
console.log({
  isCompatible: info.isCompatible,
  codec: info.codec,
  canPlay: info.canPlay,
  needsTranscoding: info.needsTranscoding,
});
```

### Manual Transcoding

```typescript
async function transcodeVideo(file: File): Promise<File> {
  const formData = new FormData();
  formData.append('video', file);

  const response = await fetch('/api/transcode-video', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Transcoding failed');
  }

  const blob = await response.blob();
  return new File([blob], 'transcoded.mp4', { type: 'video/mp4' });
}
```

## 🎨 Customization

### Custom Transcoding Settings

Edit `/src/app/api/transcode-video/route.ts`:

```typescript
// For smaller file sizes (lower quality)
'-crf', '28', // Instead of '23'

// For faster encoding (lower quality)
'-preset', 'fast', // Instead of 'medium'

// For smaller resolutions
'-vf', 'scale=1280:-2', // Max width 1280px
```

### Custom Compatibility Rules

Edit `/src/lib/videoCompatibility.ts`:

```typescript
export function estimateTranscodingNeed(file: File) {
  const reasons: string[] = [];

  // Add custom rules
  if (file.name.includes('_Android_')) {
    reasons.push('Detected Android filename pattern');
  }

  // ...rest of function
}
```

## 🐛 Troubleshooting

### "FFmpeg not found"

**Problem:** Server-side transcoding unavailable

**Solution:**
1. Install FFmpeg on your server
2. Ensure it's in the system PATH
3. Restart your Next.js server
4. Verify with `GET /api/transcode-video`

### Android Videos Still Don't Play

**Problem:** Video uploaded but won't play

**Possible causes:**
1. **Transcoding skipped** - User chose "Upload Original"
2. **Unsupported codec** - Even after transcoding
3. **Browser limitation** - Older browsers

**Solution:**
- Force transcoding for all videos from mobile devices
- Add codec detection to upload validation
- Show browser compatibility warning

### Large Videos Timeout During Transcoding

**Problem:** 500MB video takes too long

**Solution:**
```typescript
// Increase timeout in route.ts
const { stdout, stderr } = await execAsync(ffmpegCommand, {
  maxBuffer: 100 * 1024 * 1024, // 100MB buffer
  timeout: 300000, // 5 minutes
});
```

## 📊 Supported Formats

### Input (Detected)
- ✅ MP4 (H.264, H.265)
- ✅ WebM (VP8, VP9)
- ✅ MOV (QuickTime)
- ✅ 3GP (3GPP/Android)
- ✅ MKV (Matroska)
- ✅ AVI, WMV, FLV

### Output (Transcoded)
- ✅ MP4 with H.264 codec
- ✅ AAC audio
- ✅ Fast-start enabled
- ✅ Web-optimized settings

## 🔐 Security Considerations

### File Size Limits

```typescript
// Enforce on client
maxSizeMB={500}

// Enforce on server
if (videoFile.size > 500 * 1024 * 1024) {
  return NextResponse.json({ error: 'File too large' }, { status: 413 });
}
```

### File Type Validation

```typescript
// Check MIME type
const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}
```

### Temp File Cleanup

Transcoding API automatically cleans up temporary files:

```typescript
await Promise.all([
  unlink(inputPath).catch(console.error),
  unlink(outputPath).catch(console.error),
]);
```

## 📈 Performance Tips

1. **Limit video resolution** - Add `-vf scale=1920:-2` to FFmpeg command
2. **Use faster presets** - Change to `-preset fast` for quicker encoding
3. **Implement queue** - For high traffic, use job queue (BullMQ, etc.)
4. **Cache transcoded videos** - Store transcoded versions to avoid re-transcoding
5. **Progressive upload** - Chunk large files for better UX

## 🎯 Best Practices

1. **Always show progress** - Transcoding takes time, keep users informed
2. **Offer choice** - Let users decide: transcode vs upload original
3. **Validate on server** - Don't trust client-side checks alone
4. **Test on real devices** - Android video behavior varies by manufacturer
5. **Monitor errors** - Log transcoding failures for debugging

---

**Need help?** Check the [PhotoSwipe documentation](https://photoswipe.com/) or [FFmpeg guides](https://ffmpeg.org/documentation.html).
