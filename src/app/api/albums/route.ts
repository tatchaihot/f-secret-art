import { NextResponse } from 'next/server';
import { getAllAlbums, createAlbum } from '@/lib/db';

export async function GET() {
  try {
    const albums = getAllAlbums();
    return NextResponse.json({ success: true, albums });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const album = createAlbum({
      title: body.title.trim(),
      description: body.description?.trim(),
      clientName: body.clientName?.trim(),
      eventDate: body.eventDate,
      isPrivate: !!body.isPrivate,
      passcode: body.passcode?.trim(),
    });

    return NextResponse.json({ success: true, album });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
