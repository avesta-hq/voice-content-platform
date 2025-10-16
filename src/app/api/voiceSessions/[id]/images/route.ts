import { NextRequest, NextResponse } from 'next/server';
import { s3ImageService } from '@/lib/s3ImageService';
import { hybridStorageService } from '@/lib/hybridStorageService';
import type { VoiceSession, SessionImage } from '@/types';

/**
 * POST /api/voiceSessions/[id]/images
 * Upload an image for a voice session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const userId = Number(formData.get('userId'));
    const documentId = formData.get('documentId') as string;
    const order = Number(formData.get('order') || '1');
    const width = formData.get('width') ? Number(formData.get('width')) : undefined;
    const height = formData.get('height') ? Number(formData.get('height')) : undefined;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!userId || !documentId) {
      return NextResponse.json(
        { error: 'Missing userId or documentId' },
        { status: 400 }
      );
    }

    // Get session to validate it exists
    const db = await hybridStorageService.getDatabase();
    const session = db?.voiceSessions?.find((s: VoiceSession) => s.id === sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check image limit
    const currentImageCount = session.images?.length || 0;
    const maxImages = s3ImageService.getUploadConfig().maxImagesPerSession;
    
    if (currentImageCount >= maxImages) {
      return NextResponse.json(
        { error: `Maximum ${maxImages} images per session allowed` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const uploadResult = await s3ImageService.uploadImage({
      userId,
      documentId,
      sessionId,
      file: buffer,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      order,
    });

    // Create image metadata
    const newImage: SessionImage = {
      ...uploadResult,
      uploadedAt: new Date().toISOString(),
      order,
      width,
      height,
      caption: '',
    };

    // Update session in database
    if (!session.images) {
      session.images = [];
    }
    
    session.images.push(newImage);
    session.imageCount = session.images.length;

    // Save to database
    await hybridStorageService.saveDatabase(db!);

    console.log(`✅ Image added to session ${sessionId}: ${uploadResult.fileName}`);

    return NextResponse.json({
      success: true,
      image: newImage,
    });

  } catch (error) {
    console.error('Image upload error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
    const statusCode = errorMessage.includes('Invalid file type') || 
                       errorMessage.includes('File size exceeds') ||
                       errorMessage.includes('Maximum') ? 400 : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/voiceSessions/[id]/images
 * Delete a specific image from a voice session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Get database
    const db = await hybridStorageService.getDatabase();
    const session = db?.voiceSessions?.find((s: VoiceSession) => s.id === sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!session.images || session.images.length === 0) {
      return NextResponse.json(
        { error: 'No images found in session' },
        { status: 404 }
      );
    }

    // Find the image
    const image = session.images.find((img: SessionImage) => img.id === imageId);

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete from S3
    try {
      await s3ImageService.deleteImage(image.s3Path);
    } catch (s3Error) {
      console.error('S3 deletion failed:', s3Error);
      // Continue with database cleanup even if S3 fails
    }

    // Remove from database
    session.images = session.images.filter((img: SessionImage) => img.id !== imageId);
    session.imageCount = session.images.length;

    // Save to database
    await hybridStorageService.saveDatabase(db!);

    console.log(`✅ Image removed from session ${sessionId}: ${image.fileName}`);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voiceSessions/[id]/images
 * Get all images for a session (with refreshed signed URLs)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // Get database
    const db = await hybridStorageService.getDatabase();
    const session = db?.voiceSessions?.find((s: VoiceSession) => s.id === sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const images = session.images || [];

    // Refresh signed URLs if images exist
    let refreshedImages = images;
    if (images.length > 0) {
      try {
        refreshedImages = await s3ImageService.refreshSessionImageUrls(images);
        
        // Update database with refreshed URLs
        session.images = refreshedImages;
        await hybridStorageService.saveDatabase(db!);
      } catch (refreshError) {
        console.error('Failed to refresh URLs:', refreshError);
        // Return existing images if refresh fails
      }
    }

    return NextResponse.json({
      success: true,
      images: refreshedImages,
      count: refreshedImages.length,
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

