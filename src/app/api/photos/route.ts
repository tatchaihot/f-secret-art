import { NextResponse } from 'next/server';
import { createPhoto, deletePhotos, db } from '@/lib/db';
import { processUploadedImage, deleteRemoteImage } from '@/lib/image-processor';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth-guard';

export async function POST(req: Request) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

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

    // Validate MIME type and size limit
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'ไฟล์ที่อัปโหลดต้องเป็นรูปภาพเท่านั้น' },
        { status: 400 }
      );
    }

    const MAX_SIZE = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'ขนาดไฟล์เกินกำหนด (สูงสุด 25MB ต่อรูป)' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image: Upload to Cloudinary (or local fallback) with smart adaptive optimization
    const processed = await processUploadedImage(buffer, file.name, `f-secret-art/album-${albumId}`);

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
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { photoIds } = body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'photoIds array is required' },
        { status: 400 }
      );
    }

    // Cleanup from Cloudinary if remote
    const placeholders = photoIds.map(() => '?').join(',');
    const photosToDelete = db.prepare(`SELECT filename, originalUrl FROM photos WHERE id IN (${placeholders})`).all(...photoIds) as Array<{ filename: string; originalUrl: string }>;
    for (const p of photosToDelete) {
      if (p.filename?.startsWith('f-secret-art') || p.originalUrl?.includes('cloudinary.com')) {
        await deleteRemoteImage(p.filename || p.originalUrl);
      }
    }

    const count = deletePhotos(photoIds);
    return NextResponse.json({ success: true, deletedCount: count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
