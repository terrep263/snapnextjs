#!/usr/bin/env node

/**
 * Check actual video codec of files on Supabase storage
 * Usage: node check-video-codec.mjs
 */

const videoUrls = [
  'https://sharedfrom.snapworxx.com/storage/v1/object/public/photos/evt_1764258395691_5dfd48d4/1764433187479-1764280765481-20251127_165813.mp4',
  'https://sharedfrom.snapworxx.com/storage/v1/object/public/photos/evt_1764258395691_5dfd48d4/1764354846642-Listicle_Video_1764120442009.mp4'
];

async function checkVideoCodec(url) {
  console.log(`\n🔍 Checking: ${url}`);
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Content-Length: ${contentLength ? (contentLength / 1024 / 1024).toFixed(2) + ' MB' : 'unknown'}`);
    console.log(`   Status: ${response.status}`);
    
    // Get first few bytes to check for MP4 signature
    const rangeResponse = await fetch(url, { 
      headers: { 'Range': 'bytes=0-8192' }
    });
    const buffer = await rangeResponse.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Check MP4 ftyp box
    if (bytes[4] === 102 && bytes[5] === 116 && bytes[6] === 121 && bytes[7] === 112) {
      const brand = String.fromCharCode(...bytes.slice(8, 12));
      console.log(`   MP4 Brand: ${brand}`);
      
      // Look for codec strings
      const text = new TextDecoder().decode(bytes);
      if (text.includes('hev1') || text.includes('hvc1')) {
        console.log(`   ⚠️  DETECTED: H.265/HEVC (not browser compatible!)`);
      } else if (text.includes('avc1')) {
        console.log(`   ✅ DETECTED: H.264/AVC (browser compatible)`);
      } else if (text.includes('vp9')) {
        console.log(`   ⚠️  DETECTED: VP9 (limited browser support)`);
      } else if (text.includes('av01')) {
        console.log(`   ⚠️  DETECTED: AV1 (limited browser support)`);
      } else {
        console.log(`   ❓ Unknown codec in MP4 file`);
      }
    } else {
      console.log(`   ❓ Not a standard MP4 file or different format`);
    }
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

console.log('🎬 Video Codec Detection Tool');
console.log('=============================');

Promise.all(videoUrls.map(checkVideoCodec)).then(() => {
  console.log('\n✅ Check complete');
});
