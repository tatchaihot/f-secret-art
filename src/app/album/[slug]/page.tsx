import { notFound } from 'next/navigation';
import { getAlbumBySlug } from '@/lib/db';
import Navbar from '@/components/Navbar';
import AlbumClientView from './AlbumClientView';
import type { Metadata } from 'next';


export const dynamic = 'force-dynamic';

interface AlbumPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = getAlbumBySlug(slug);
  if (!album) return { title: 'Album Not Found — Lumen Atelier' };

  return {
    title: `${album.title} — Lumen Atelier Archive`,
    description: album.description || `Photo gallery for ${album.title}`,
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { slug } = await params;
  const album = getAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0b] text-zinc-100">
      <Navbar />
      <main className="flex-1">
        <AlbumClientView album={album} />
      </main>
    </div>
  );
}
