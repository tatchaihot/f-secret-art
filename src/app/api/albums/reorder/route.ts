import { NextResponse } from 'next/server';
import { reorderAlbums } from '@/lib/db';
import { verifyAdminSession, unauthorizedResponse } from '@/lib/auth-guard';
import { revalidateCatalogPages } from '@/lib/revalidate';

export async function PUT(req: Request) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return unauthorizedResponse();

  try {
    const body = await req.json();
    const orderedIds = Array.isArray(body?.orderedIds)
      ? body.orderedIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      : [];

    if (orderedIds.length === 0) {
      return NextResponse.json({ success: false, error: 'orderedIds array is required' }, { status: 400 });
    }

    await reorderAlbums(orderedIds);
    revalidateCatalogPages();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
