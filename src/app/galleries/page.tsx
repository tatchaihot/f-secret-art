import Link from 'next/link';
import Image from 'next/image';
import { getAllAlbums } from '@/lib/db';
import Navbar from '@/components/Navbar';
import AlbumCoverGrid from '@/components/AlbumCoverGrid';
import { ArrowLeft, ArrowRight, Images, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'รวมแคตตาล็อกสไตล์ภาพ AI ทั้งหมด — F-Secret AI Art',
  description: 'เลือกชมสไตล์ภาพ AI ทั้งหมดสำหรับสร้างภาพโปรไฟล์ นางแบบ สินค้า โฆษณา และคอนเซ็ปต์อาร์ต',
};

export default async function GalleriesPage() {
  const albums = await getAllAlbums();

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0a0d] text-stone-100 selection:bg-amber-500 selection:text-stone-950">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between pb-6 border-b border-amber-500/15 mb-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-mono text-xs text-stone-400 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 transform transition-transform group-hover:-translate-x-1" />
            <span>กลับสู่หน้าแรก</span>
          </Link>

          <span className="font-mono text-xs text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full shadow-sm shadow-amber-500/10">
            ทั้งหมด {albums.length} สไตล์
          </span>
        </div>

        {/* Page Title */}
        <div className="max-w-3xl space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            All AI Style Collections
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-white">
            แคตตาล็อกสไตล์ภาพ AI ทั้งหมด
          </h1>
          <p className="text-sm sm:text-base text-stone-300 font-light leading-relaxed">
            เลือกดูสไตล์ที่ตรงกับเป้าหมายการใช้งานของคุณ สามารถคลิกเข้าไปเพื่อดูภาพขนาดเต็มแบบคมชัด และกดหัวใจเพื่อส่งรูปที่ชอบมาทางไลน์ได้ทันทีค่ะ
          </p>
        </div>

        {/* Full Grid of Albums */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => {
            return (
              <Link
                key={album.id}
                href={`/album/${album.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl glass-panel transition-all duration-300 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-orange-500/15"
              >
                <AlbumCoverGrid
                  previewPhotos={album.previewPhotos}
                  coverImage={album.coverImage}
                  title={album.title}
                  photoCount={album.photoCount || 0}
                />

                <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                  <div>
                    <h3 className="font-serif text-xl font-medium text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="mt-2 text-xs sm:text-sm text-stone-400 line-clamp-2 leading-relaxed font-light">
                        {album.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-amber-500/15 text-xs font-mono text-stone-300 group-hover:text-amber-200 transition-colors">
                    <span className="text-amber-400 font-semibold group-hover:underline">
                      เข้าชมแกลเลอรีนี้
                    </span>
                    <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-500/15 bg-[#080709] py-10 mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="F-Secret Logo" width={24} height={24} className="object-contain" />
            <span>© {new Date().getFullYear()} F-SECRET BY TATCHAI. ALL RIGHTS RESERVED.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-amber-300 transition-colors">หน้าแรก</Link>
            <Link href="/admin" className="hover:text-stone-200 transition-colors">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
