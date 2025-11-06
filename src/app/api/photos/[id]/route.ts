import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const photoId = id;

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    // Get the photo to find the storage path
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete from storage if it has a file path
    if (photo.file_path || photo.url) {
      const storagePath = photo.file_path || photo.url.split('/').pop();
      if (storagePath) {
        await supabase
          .storage
          .from('photos')
          .remove([storagePath]);
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete photo: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Photo deleted:', photoId);
    return NextResponse.json(
      { success: true, message: 'Photo deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
