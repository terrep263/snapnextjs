import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, getPhotoPublicUrl } from '@/lib/supabase';
import {
  shouldApplyWatermark,
  applyWatermarkToImage,
  applyWatermarkToVideo,
  PackageType,
} from '@/lib/download-utils';
import { getPackageType } from '@/lib/gallery-utils';
import { checkRateLimit, incrementRateLimit, getClientIdentifier } from '@/lib/rate-limiter';
import ErrorLogger from '@/lib/errorLogger';

const DOWNLOAD_RATE_LIMIT = 100; // 100 downloads per hour per IP

/**
 * POST /api/download/single
 * 
 * Single-item download endpoint with package-based watermarking
 * Returns signed URL or watermarked file based on package type
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoId, eventId } = body;

    if (!photoId || !eventId) {
      return NextResponse.json(
        { success: false, error: 'Photo ID and Event ID are required' },
        { status: 400 }
      );
    }

    // Rate limiting for downloads
    const clientId = getClientIdentifier(request);
    const downloadKey = `download:${clientId}`;
    const downloadRateLimit = checkRateLimit(downloadKey, DOWNLOAD_RATE_LIMIT);
    
    if (!downloadRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Maximum ${DOWNLOAD_RATE_LIMIT} downloads per hour. Please try again later.`,
        },
        { status: 429 }
      );
    }

    const supabase = getServiceRoleClient();

    // Load event and photo (select fields needed for package detection)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, slug, is_freebie, is_free, watermark_enabled, feed_enabled, password_hash, payment_type')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('id, event_id, url, storage_url, file_path, is_video, filename')
      .eq('id', photoId)
      .eq('event_id', eventId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Detect package type using centralized function
    const packageType = getPackageType(event);
    const needsWatermark = shouldApplyWatermark(event, packageType);
    
    // Log package detection for debugging
    console.log('📦 Download request:', {
      eventId: event.id,
      eventName: event.name,
      is_freebie: event.is_freebie,
      is_free: event.is_free,
      payment_type: event.payment_type,
      packageType,
      needsWatermark,
      photoId,
      isVideo: photo.is_video,
    });

    // For Premium without watermark, return signed URL to original
    if (packageType === 'premium' && !needsWatermark) {
      // Generate signed URL (1 hour expiry)
      const expiresIn = 3600; // 1 hour
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('photos')
        .createSignedUrl(photo.file_path || photo.storage_url || photo.url, expiresIn);

      if (signedUrlError || !signedUrlData) {
        throw new Error('Failed to generate signed URL');
      }

      incrementRateLimit(downloadKey);

      // For videos, indicate that client should fetch as blob to force download
      return NextResponse.json({
        success: true,
        data: {
          url: signedUrlData.signedUrl,
          isWatermarked: false,
          packageType: 'premium',
          isVideo: photo.is_video,
          filename: photo.filename || (photo.is_video ? 'video.mp4' : 'photo.jpg'),
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        },
      });
    }

    // For Basic, Freebie, or Premium with watermark enabled, generate watermarked version
    // Extract file path from storage URL or use file_path
    let filePath = photo.file_path;
    
    // If file_path is not available, extract from storage_url or url
    if (!filePath) {
      const url = photo.storage_url || photo.url;
      if (url) {
        // Extract path from Supabase storage URL
        // Pattern: https://...supabase.co/storage/v1/object/public/photos/<path>
        // or: https://sharedfrom.snapworxx.com/storage/v1/object/public/photos/<path>
        const match = url.match(/\/photos\/(.+)$/);
        if (match) {
          filePath = match[1];
        }
      }
    }

    if (!filePath) {
      throw new Error('Unable to determine file path');
    }

    const { data: fileData, error: fileError } = await supabase.storage
      .from('photos')
      .download(filePath);

    if (fileError || !fileData) {
      throw new Error('Failed to download file from storage');
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let watermarkedBuffer: Buffer;
    let contentType: string;
    let filename: string;

    if (photo.is_video) {
      // Video watermarking - required for freebie/basic, optional for premium
      console.log(`🎬 Processing video download - package: ${packageType}, needsWatermark: ${needsWatermark}`);
      console.log(`📊 Video details: size=${buffer.length} bytes, filename=${photo.filename}`);
      
      const watermarked = await applyWatermarkToVideo(buffer, packageType);
      if (watermarked) {
        watermarkedBuffer = watermarked;
        contentType = 'video/mp4';
        console.log(`✅ Video watermarking successful - package: ${packageType}, output size: ${watermarked.length} bytes`);
      } else {
        // Video watermarking failed
        console.error(`❌ Video watermarking failed for package: ${packageType}, needsWatermark: ${needsWatermark}`);
        console.error(`📋 Event details: is_freebie=${event.is_freebie}, is_free=${event.is_free}, payment_type=${event.payment_type}`);
        
        // For freebie/basic, watermarking is required - throw error
        if (needsWatermark) {
          console.error(`🚨 CRITICAL: Watermarking required but failed for ${packageType} package`);
          throw new Error('Video watermarking failed. This is required for your event type. Please contact support if this issue persists.');
        }
        
        // For premium without watermark requirement, return original
        // But log a warning
        console.warn('⚠️ Returning unwatermarked video for premium package');
        const { data: signedUrlData } = await supabase.storage
          .from('photos')
          .createSignedUrl(filePath, 3600);

        incrementRateLimit(downloadKey);

        return NextResponse.json({
          success: true,
          data: {
            url: signedUrlData?.signedUrl || photo.url,
            isWatermarked: false,
            packageType,
            isVideo: true,
            filename: photo.filename || 'video.mp4',
          },
        });
      }
      filename = photo.filename || 'video.mp4';
    } else {
      // Image watermarking
      watermarkedBuffer = await applyWatermarkToImage(buffer, packageType);
      contentType = 'image/jpeg';
      filename = (photo.filename || 'photo.jpg').replace(/\.[^.]+$/, '.jpg');
    }

    // Upload watermarked version to temporary storage (or return directly)
    // For now, we'll return the watermarked buffer directly
    // In production, you might want to cache watermarked versions

    incrementRateLimit(downloadKey);

    // Return watermarked file directly
    // Use proper filename encoding for Content-Disposition header
    const encodedFilename = encodeURIComponent(filename);
    
    return new NextResponse(new Uint8Array(watermarkedBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': watermarkedBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // 1 hour cache
        'X-Content-Type-Options': 'nosniff', // Prevent MIME type sniffing
      },
    });
  } catch (err: any) {
    console.error('Download error:', err);

    await ErrorLogger.log({
      errorType: 'DOWNLOAD_ERROR',
      errorMessage: err.message,
      stackTrace: err.stack,
      requestData: {
        url: request.url,
        method: request.method,
      },
      severity: 'high',
    });

    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Download failed',
      },
      { status: 500 }
    );
  }
}

