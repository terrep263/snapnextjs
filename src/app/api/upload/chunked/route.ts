import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, getPhotoPublicUrl } from '@/lib/supabase';
import {
  validateFile,
  stripExifData,
  generateImageThumbnail,
  getImageDimensions,
} from '@/lib/upload-utils';
import { checkRateLimit, incrementRateLimit, getClientIdentifier } from '@/lib/rate-limiter';
import ErrorLogger from '@/lib/errorLogger';
import sharp from 'sharp';

import { GALLERY_MAX_PHOTO_SIZE, GALLERY_MAX_VIDEO_SIZE } from '@/config/constants';

const MAX_PHOTO_SIZE = GALLERY_MAX_PHOTO_SIZE;
const MAX_VIDEO_SIZE = GALLERY_MAX_VIDEO_SIZE;

/**
 * POST /api/upload/chunked
 * 
 * Chunked/resumable upload endpoint for gallery uploads
 * Supports both single file uploads and chunked uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Maximum ${50} uploads per hour. Please try again later.`,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const eventId = formData.get('eventId') as string | null;
    const chunkIndex = formData.get('chunkIndex') as string | null;
    const totalChunks = formData.get('totalChunks') as string | null;
    const uploadId = formData.get('uploadId') as string | null;
    const filename = formData.get('filename') as string | null;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Verify event exists and check storage limits
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, max_storage_bytes, max_photos')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get current storage usage
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('size')
      .eq('event_id', eventId);

    if (photosError) {
      console.error('Error fetching photos:', photosError);
    }

    const currentStorage = photos?.reduce((sum, p) => sum + (p.size || 0), 0) || 0;
    const currentPhotoCount = photos?.length || 0;

    // Convert file to buffer for validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file type and size using magic bytes
    const validation = validateFile(buffer, filename || file.name, file.type);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'File validation failed' },
        { status: 400 }
      );
    }

    const fileType = validation.detectedType || file.type;
    const isImage = fileType.startsWith('image/');
    const isVideo = fileType.startsWith('video/');

    // Check storage limits
    if (event.max_storage_bytes && currentStorage + buffer.length > event.max_storage_bytes) {
      return NextResponse.json(
        {
          success: false,
          error: `This event has reached its storage limit. Cannot upload ${(buffer.length / 1024 / 1024).toFixed(1)}MB.`,
        },
        { status: 413 }
      );
    }

    // Check photo count limit
    if (event.max_photos && currentPhotoCount >= event.max_photos) {
      return NextResponse.json(
        {
          success: false,
          error: `Photo limit reached. This event allows a maximum of ${event.max_photos} photos.`,
        },
        { status: 413 }
      );
    }

    // Generate file path
    const timestamp = Date.now();
    const sanitizedFilename = (filename || file.name).replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${eventId}/${timestamp}-${sanitizedFilename}`;

    // Process image: strip EXIF and generate thumbnail
    let processedBuffer = buffer;
    let thumbnailBuffer: Buffer | null = null;
    let thumbnailPath: string | null = null;
    let width: number | null = null;
    let height: number | null = null;

    if (isImage) {
      // Strip EXIF data for privacy
      processedBuffer = Buffer.from(await stripExifData(buffer));

      // Get dimensions
      const dimensions = await getImageDimensions(processedBuffer);
      if (dimensions) {
        width = dimensions.width;
        height = dimensions.height;
      }

      // Generate thumbnail
      try {
        thumbnailBuffer = await generateImageThumbnail(processedBuffer, 400);
        // Use .jpg extension for thumbnails
        const thumbFilename = sanitizedFilename.replace(/\.[^.]+$/, '.jpg');
        thumbnailPath = `${eventId}/thumbnails/${timestamp}-${thumbFilename}`;

        // Upload thumbnail to storage
        const { error: thumbError } = await supabase.storage
          .from('photos')
          .upload(thumbnailPath, thumbnailBuffer, {
            cacheControl: '3600',
            contentType: 'image/jpeg',
          });

        if (thumbError) {
          console.warn('Failed to upload thumbnail:', thumbError);
          // Continue without thumbnail
          thumbnailPath = null;
        }
      } catch (thumbErr) {
        console.warn('Failed to generate thumbnail:', thumbErr);
        // Continue without thumbnail
      }
    } else if (isVideo) {
      // For videos, we'll set thumbnail_url to the video URL itself after upload
      // Browsers can generate poster frames from the video automatically
      // The poster attribute on video elements will use this thumbnail_url
      // Future: Can generate actual thumbnail frames using FFmpeg if needed
      // Note: thumbnailUrl will be set to publicUrl after upload
    }

    // Upload main file to storage
    const blob = new Blob([processedBuffer], { type: fileType });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, blob, {
        cacheControl: '3600',
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URLs
    const publicUrl = getPhotoPublicUrl(filePath);
    // For videos, use video URL as thumbnail; for images, use generated thumbnail if available
    const thumbnailUrl = isVideo 
      ? publicUrl 
      : (thumbnailPath ? getPhotoPublicUrl(thumbnailPath) : null);

    // Create photo record in database
    const { data: photoData, error: dbError } = await supabase
      .from('photos')
      .insert({
        event_id: eventId,
        filename: sanitizedFilename,
        url: publicUrl,
        storage_url: publicUrl,
        file_path: filePath,
        thumbnail_url: thumbnailUrl || publicUrl, // Fallback to main URL if no thumbnail
        thumbnail_path: thumbnailPath,
        size: buffer.length,
        type: fileType,
        mime_type: fileType,
        is_video: isVideo,
        width: width,
        height: height,
        is_approved: true, // Auto-approve for gallery uploads
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating photo record:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('photos').remove([filePath]);
      if (thumbnailPath) {
        await supabase.storage.from('photos').remove([thumbnailPath]);
      }
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Increment rate limit
    incrementRateLimit(clientId);

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        id: photoData.id,
        filename: photoData.filename,
        url: photoData.url,
        storage_url: photoData.storage_url,
        thumbnail_url: photoData.thumbnail_url,
        width: photoData.width,
        height: photoData.height,
        size: photoData.size,
        is_video: photoData.is_video,
        created_at: photoData.created_at,
      },
    });
  } catch (err: any) {
    console.error('Upload error:', err);

    await ErrorLogger.log({
      errorType: 'UPLOAD_ERROR',
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
        error: err.message || 'Upload failed',
      },
      { status: 500 }
    );
  }
}

