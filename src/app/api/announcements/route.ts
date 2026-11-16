import { NextResponse } from 'next/server';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  reorderAnnouncements,
} from '@/lib/db';
import { processUploadedImage, deleteRemoteImage } from '@/lib/image-processor';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth-guard';
import { revalidateHomePage } from '@/lib/revalidate';

function isRemoteManagedImage(url: string | null | undefined): boolean {
  return Boolean(url && (url.includes('cloudinary.com') || url.startsWith('f-secret-art')));
}

async function processAnnouncementImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('ไฟล์ต้องเป็นรูปภาพเท่านั้น');
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('ขนาดไฟล์เกิน 25MB');
  }
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const processed = await processUploadedImage(buffer, file.name, 'f-secret-art/announcements');
  return processed.previewUrl;
}

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
      const title = ((formData.get('title') as string | null) || '').trim();
      const content = ((formData.get('content') as string | null) || '').trim();
      const linkUrl = ((formData.get('linkUrl') as string | null) || '').trim();
      const sortOrder = formData.get('sortOrder') as string | null;
      const isActiveRaw = formData.get('isActive') as string | null;
      const hasFile = Boolean(file && file.size > 0);

      if (!title && !content && !hasFile) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุหัวข้อ เนื้อหา หรือแนบรูปภาพอย่างน้อย 1 อย่าง' },
          { status: 400 }
        );
      }

      let imageUrl: string | undefined;
      if (hasFile && file) {
        try {
          imageUrl = await processAnnouncementImageFile(file);
        } catch (err: any) {
          return NextResponse.json({ success: false, error: err.message }, { status: 400 });
        }
      }

      const announcement = await createAnnouncement({
        title,
        content: content || undefined,
        imageUrl,
        linkUrl: linkUrl || undefined,
        isActive: isActiveRaw !== 'false',
        sortOrder: Number(sortOrder) || 0,
      });

      revalidateHomePage();
      return NextResponse.json({ success: true, announcement });
    } else {
      const body = await req.json();
      const title = (body.title || '').trim();
      const content = (body.content || '').trim();
      if (!title && !content && !body.imageUrl) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุหัวข้อ เนื้อหา หรือรูปภาพอย่างน้อย 1 อย่าง' },
          { status: 400 }
        );
      }
      const announcement = await createAnnouncement({
        title,
        content: content || undefined,
        imageUrl: body.imageUrl,
        linkUrl: body.linkUrl,
        isActive: body.isActive !== false,
        sortOrder: Number(body.sortOrder) || 0,
      });

      revalidateHomePage();
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
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const id = ((formData.get('id') as string | null) || '').trim();
      if (!id) {
        return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
      }

      const existing = await getAnnouncementById(id);
      if (!existing) {
        return NextResponse.json({ success: false, error: 'ไม่พบประกาศที่ต้องการแก้ไข' }, { status: 404 });
      }

      const file = formData.get('file') as File | null;
      const removeImage = formData.get('removeImage') === 'true';
      const title = ((formData.get('title') as string | null) || '').trim();
      const content = ((formData.get('content') as string | null) || '').trim();
      const linkUrl = ((formData.get('linkUrl') as string | null) || '').trim();
      const isActiveRaw = formData.get('isActive') as string | null;
      const sortOrderRaw = formData.get('sortOrder') as string | null;
      const hasFile = Boolean(file && file.size > 0);

      let nextImageUrl: string | null | undefined = undefined;
      if (hasFile && file) {
        try {
          nextImageUrl = await processAnnouncementImageFile(file);
        } catch (err: any) {
          return NextResponse.json({ success: false, error: err.message }, { status: 400 });
        }
        if (isRemoteManagedImage(existing.imageUrl)) {
          await deleteRemoteImage(existing.imageUrl!);
        }
      } else if (removeImage) {
        if (isRemoteManagedImage(existing.imageUrl)) {
          await deleteRemoteImage(existing.imageUrl!);
        }
        nextImageUrl = null;
      }

      const finalHasImage = nextImageUrl !== undefined ? Boolean(nextImageUrl) : Boolean(existing.imageUrl);
      if (!title && !content && !finalHasImage) {
        return NextResponse.json(
          { success: false, error: 'กรุณาระบุหัวข้อ เนื้อหา หรือรูปภาพอย่างน้อย 1 อย่าง' },
          { status: 400 }
        );
      }

      const updated = await updateAnnouncement(id, {
        title,
        content: content || null,
        linkUrl: linkUrl || null,
        isActive: isActiveRaw !== null ? (isActiveRaw !== 'false' ? 1 : 0) : existing.isActive,
        sortOrder: sortOrderRaw !== null ? Number(sortOrderRaw) || 0 : existing.sortOrder,
        ...(nextImageUrl !== undefined ? { imageUrl: nextImageUrl } : {}),
      });

      revalidateHomePage();
      return NextResponse.json({ success: true, announcement: updated });
    }

    const body = await req.json();

    if (Array.isArray(body?.orderedIds)) {
      const orderedIds = body.orderedIds.filter(
        (id: unknown): id is string => typeof id === 'string' && id.trim().length > 0
      );
      if (orderedIds.length === 0) {
        return NextResponse.json({ success: false, error: 'orderedIds array is required' }, { status: 400 });
      }
      await reorderAnnouncements(orderedIds);
      revalidateHomePage();
      return NextResponse.json({ success: true });
    }

    if (!body.id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const updatePayload: Partial<{
      title: string;
      content: string | null;
      imageUrl: string | null;
      linkUrl: string | null;
      isActive: number;
      sortOrder: number;
    }> = {};
    if ('title' in body) updatePayload.title = body.title;
    if ('content' in body) updatePayload.content = body.content;
    if ('imageUrl' in body) updatePayload.imageUrl = body.imageUrl;
    if ('linkUrl' in body) updatePayload.linkUrl = body.linkUrl;
    if (body.isActive !== undefined) updatePayload.isActive = body.isActive ? 1 : 0;
    if (body.sortOrder !== undefined) updatePayload.sortOrder = Number(body.sortOrder) || 0;

    const updated = await updateAnnouncement(body.id, updatePayload);

    revalidateHomePage();
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
    revalidateHomePage();
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
