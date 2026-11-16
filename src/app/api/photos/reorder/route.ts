import { NextResponse } from 'next/server';
import { reorderPhotos, getAlbumById } from '@/lib/db';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth-guard';
import { revalidateCatalogPages } from '@/lib/revalidate';

export async function PUT(req: Request) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const albumId = typeof body?.albumId === 'string' ? body.albumId.trim() : '';
    const orderedPhotoIds = Array.isArray(body?.orderedPhotoIds)
      ? body.orderedPhotoIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      : [];

    if (!albumId || orderedPhotoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'albumId and orderedPhotoIds array are required' },
        { status: 400 }
      );
    }

    await reorderPhotos(albumId, orderedPhotoIds);
    const album = await getAlbumById(albumId);
    revalidateCatalogPages(album?.slug ? [album.slug] : []);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
