import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAllAlbums, seedSampleData } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard — Lumen Atelier Archive',
};


export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (session?.value !== 'authenticated_admin') {
    redirect('/admin/login');
  }

  // Ensure sample data is initialized if clean
  try {
    seedSampleData();
  } catch (e) {
    // Ignore seed check error
  }

  const albums = getAllAlbums();

  return <AdminDashboardClient initialAlbums={albums} />;
}
