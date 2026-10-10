import { NextResponse } from 'next/server';
import { createPhoto, deletePhotos } from '@/lib/db';
import { processUploadedImage } from '@/lib/image-processor';


export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const albumId = formData.get('albumId') as string | null;

    if (!file || !albumId) {
      return NextResponse.json(
        { success: false, error: 'File and albumId are required' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image: generate originals, webp previews, thumbs, and LQIP
    const processed = await processUploadedImage(buffer, file.name);

    // Save record to SQLite
    const photo = createPhoto({
      albumId,
      originalName: file.name,
      filename: processed.filename,
      originalUrl: processed.originalUrl,
      previewUrl: processed.previewUrl,
      thumbUrl: processed.thumbUrl,
      blurDataUrl: processed.blurDataUrl,
      width: processed.width,
      height: processed.height,
      fileSize: processed.fileSize,
    });

    return NextResponse.json({ success: true, photo });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { photoIds } = body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'photoIds array is required' },
        { status: 400 }
      );
    }

    const count = deletePhotos(photoIds);
    return NextResponse.json({ success: true, deletedCount: count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
