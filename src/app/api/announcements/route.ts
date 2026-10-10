import { NextResponse } from 'next/server';
import { getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, db } from '@/lib/db';
import { processUploadedImage, deleteRemoteImage } from '@/lib/image-processor';

export async function GET() {
  try {
    const announcements = getAllAnnouncements();
    return NextResponse.json({ success: true, announcements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const title = formData.get('title') as string | null;
      const content = formData.get('content') as string | null;
      const linkUrl = formData.get('linkUrl') as string | null;
      const sortOrder = formData.get('sortOrder') as string | null;

      if (!title) {
        return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
      }

      let imageUrl: string | undefined;
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const processed = await processUploadedImage(buffer, file.name, 'f-secret-art/announcements');
        imageUrl = processed.previewUrl;
      }

      const announcement = createAnnouncement({
        title: title.trim(),
        content: content?.trim() || undefined,
        imageUrl,
        linkUrl: linkUrl?.trim() || undefined,
        isActive: true,
        sortOrder: Number(sortOrder) || 0,
      });

      return NextResponse.json({ success: true, announcement });
    } else {
      const body = await req.json();
      const announcement = createAnnouncement({
        title: body.title,
        content: body.content,
        imageUrl: body.imageUrl,
        linkUrl: body.linkUrl,
        isActive: body.isActive !== false,
        sortOrder: Number(body.sortOrder) || 0,
      });

      return NextResponse.json({ success: true, announcement });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const updated = updateAnnouncement(body.id, {
      title: body.title,
      content: body.content,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl,
      isActive: body.isActive !== undefined ? (body.isActive ? 1 : 0) : undefined,
      sortOrder: Number(body.sortOrder) || 0,
    });

    return NextResponse.json({ success: true, announcement: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const ann = db.prepare('SELECT imageUrl FROM announcements WHERE id = ?').get(id) as { imageUrl: string | null } | undefined;
    if (ann?.imageUrl && (ann.imageUrl.includes('cloudinary.com') || ann.imageUrl.startsWith('f-secret-art'))) {
      await deleteRemoteImage(ann.imageUrl);
    }

    const ok = deleteAnnouncement(id);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
