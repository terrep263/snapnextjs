import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const eventSlug = formData.get('eventSlug') as string;

    if (!eventSlug) {
      return NextResponse.json(
        { error: 'Event slug is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Verify event exists and is active
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, slug, is_active')
      .eq('slug', eventSlug)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!event.is_active) {
      return NextResponse.json(
        { error: 'Event is no longer active' },
        { status: 403 }
      );
    }

    // Upload files and create photo records
    const uploadedPhotos = [];
    const errors = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          errors.push({ file: file.name, error: 'Not an image file' });
          continue;
        }

        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          errors.push({ file: file.name, error: 'File too large (max 50MB)' });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop() || 'jpg';
        const uniqueFileName = `${nanoid(16)}.${fileExt}`;
        const storagePath = `${eventSlug}/${uniqueFileName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          errors.push({ file: file.name, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(storagePath);

        // Create photo record in database
        const { data: photoRecord, error: dbError } = await supabase
          .from('photos')
          .insert({
            event_id: event.id,
            file_name: file.name,
            file_path: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            storage_path: storagePath,
            uploader_ip: request.headers.get('x-forwarded-for') ||
                         request.headers.get('x-real-ip') ||
                         'unknown',
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          // Try to delete the uploaded file
          await supabase.storage.from('event-photos').remove([storagePath]);
          errors.push({ file: file.name, error: 'Failed to save photo metadata' });
          continue;
        }

        uploadedPhotos.push({
          id: photoRecord.id,
          fileName: file.name,
          url: publicUrl,
          size: file.size,
        });
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        errors.push({
          file: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedPhotos.length,
      failed: errors.length,
      photos: uploadedPhotos,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photos' },
      { status: 500 }
    );
  }
}
