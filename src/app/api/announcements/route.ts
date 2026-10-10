import { NextResponse } from 'next/server';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
} from '@/lib/db';
import { processUploadedImage, deleteRemoteImage } from '@/lib/image-processor';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth-guard';

export async function GET() {
  try {
    const announcements = await getAllAnnouncements();
    return NextResponse.json({ success: true, announcements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

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
        if (!file.type.startsWith('image/')) {
          return NextResponse.json({ success: false, error: 'ไฟล์ต้องเป็นรูปภาพเท่านั้น' }, { status: 400 });
        }
        if (file.size > 25 * 1024 * 1024) {
          return NextResponse.json({ success: false, error: 'ขนาดไฟล์เกิน 25MB' }, { status: 400 });
        }
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const processed = await processUploadedImage(buffer, file.name, 'f-secret-art/announcements');
        imageUrl = processed.previewUrl;
      }

      const announcement = await createAnnouncement({
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
      const announcement = await createAnnouncement({
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
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const updated = await updateAnnouncement(body.id, {
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
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const ann = await getAnnouncementById(id);
    if (ann?.imageUrl && (ann.imageUrl.includes('cloudinary.com') || ann.imageUrl.startsWith('f-secret-art'))) {
      await deleteRemoteImage(ann.imageUrl);
    }

    const ok = await deleteAnnouncement(id);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
