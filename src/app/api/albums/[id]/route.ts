import { NextResponse } from 'next/server';
import { getAlbumById, updateAlbum, deleteAlbum } from '@/lib/db';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth-guard';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const album = getAlbumById(id);
    if (!album) {
      return NextResponse.json({ success: false, error: 'Album not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, album });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = updateAlbum(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Album not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, album: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const { id } = await params;
    const deleted = deleteAlbum(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Album not found or already deleted' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Album deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
