import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAllAlbums, getAllAnnouncements, getAllFaqs, seedSampleData } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard — F-Secret AI Art',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (session?.value !== 'authenticated_admin') {
    redirect('/admin/login');
  }

  try {
    await seedSampleData();
  } catch (e) {
    // Ignore seed check error
  }

  const albums = await getAllAlbums();
  const announcements = await getAllAnnouncements();
  const faqs = await getAllFaqs();

  return (
    <AdminDashboardClient
      initialAlbums={albums}
      initialAnnouncements={announcements}
      initialFaqs={faqs}
    />
  );
}
