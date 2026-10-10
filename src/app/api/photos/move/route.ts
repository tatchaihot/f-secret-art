import { NextResponse } from 'next/server';
import { movePhotos } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { photoIds, targetAlbumId } = body;

    if (!Array.isArray(photoIds) || photoIds.length === 0 || !targetAlbumId) {
      return NextResponse.json(
        { success: false, error: 'photoIds and targetAlbumId are required' },
        { status: 400 }
      );
    }

    const movedCount = movePhotos(photoIds, targetAlbumId);
    return NextResponse.json({ success: true, movedCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
