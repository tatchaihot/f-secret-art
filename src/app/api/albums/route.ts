import { NextResponse } from 'next/server';
import { getAllAlbums, createAlbum, reorderAlbums, getAlbumById } from '@/lib/db';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth-guard';
import { revalidateCatalogPages } from '@/lib/revalidate';

export async function GET() {
  try {
    const albums = await getAllAlbums();
    return NextResponse.json({ success: true, albums });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const existingAlbums = body.placeAtTop ? await getAllAlbums() : [];
    const createdAlbum = await createAlbum({
      title: body.title.trim(),
      description: body.description,
      clientName: body.clientName,
      eventDate: body.eventDate,
      isPrivate: body.isPrivate,
      passcode: body.passcode,
      sortOrder: body.placeAtTop ? 1 : Number(body.sortOrder) || existingAlbums.length + 1,
    });

    if (body.placeAtTop && existingAlbums.length > 0) {
      await reorderAlbums([createdAlbum.id, ...existingAlbums.map((a) => a.id)]);
    }

    const album = (await getAlbumById(createdAlbum.id)) || createdAlbum;
    revalidateCatalogPages(album?.slug ? [album.slug] : []);

    return NextResponse.json({ success: true, album });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
