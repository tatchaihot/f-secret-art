import { NextResponse } from 'next/server';
import { getAllAlbums, createAlbum } from '@/lib/db';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth-guard';

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

    const album = await createAlbum({
      title: body.title.trim(),
      description: body.description?.trim(),
      sortOrder: Number(body.sortOrder) || 0,
    });

    return NextResponse.json({ success: true, album });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
