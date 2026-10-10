import { NextResponse } from 'next/server';
import { setAlbumCover } from '@/lib/db';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth-guard';

export async function POST(req: Request) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { albumId, photoThumbUrl } = body;

    if (!albumId || !photoThumbUrl) {
      return NextResponse.json(
        { success: false, error: 'albumId and photoThumbUrl are required' },
        { status: 400 }
      );
    }

    const ok = setAlbumCover(albumId, photoThumbUrl);
    return NextResponse.json({ success: ok });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
