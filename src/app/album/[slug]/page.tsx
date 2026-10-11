import { notFound } from 'next/navigation';
import { getAlbumBySlug, getAllAlbums } from '@/lib/db';
import Navbar from '@/components/Navbar';
import AlbumClientView from './AlbumClientView';
import type { Metadata } from 'next';

export const revalidate = 60;

interface AlbumPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const albums = await getAllAlbums();
    return albums.map((album) => ({
      slug: album.slug,
    }));
  } catch (e) {
    return [];
  }
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (!album) return { title: 'Album Not Found — F-Secret AI Art' };

  return {
    title: `${album.title} — F-Secret AI Art`,
    description: album.description || `Photo gallery for ${album.title}`,
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

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
