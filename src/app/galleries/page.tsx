import Link from 'next/link';
import Image from 'next/image';
import { getAllAlbums } from '@/lib/db';
import Navbar from '@/components/Navbar';
import { ArrowLeft, ArrowRight, Images, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'รวมแคตตาล็อกสไตล์ภาพ AI ทั้งหมด — F-Secret AI Art',
  description: 'เลือกชมสไตล์ภาพ AI ทั้งหมดสำหรับสร้างภาพโปรไฟล์ นางแบบ สินค้า โฆษณา และคอนเซ็ปต์อาร์ต',
};

export default async function GalleriesPage() {
  const albums = getAllAlbums();

  return (
    <div className="min-h-screen flex flex-col bg-[#060709] text-zinc-100">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.08] mb-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-mono text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 transform transition-transform group-hover:-translate-x-1" />
            <span>กลับสู่หน้าแรก</span>
          </Link>

          <span className="font-mono text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
            ทั้งหมด {albums.length} สไตล์
          </span>
        </div>

        {/* Page Title */}
        <div className="max-w-3xl space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-purple-400">
            <Sparkles className="h-3.5 w-3.5" />
            All AI Style Collections
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-white">
            แคตตาล็อกสไตล์ภาพ AI ทั้งหมด
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
            เลือกดูสไตล์ที่ตรงกับเป้าหมายการใช้งานของคุณ สามารถคลิกเข้าไปเพื่อดูภาพขนาดเต็มแบบคมชัด และกดหัวใจเพื่อส่งรูปที่ชอบมาทางไลน์ได้ทันที
          </p>
        </div>

        {/* Full Grid of Albums */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => {
            const cover = album.coverImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

            return (
              <Link
                key={album.id}
                href={`/album/${album.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl glass-panel transition-all duration-300 hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/10"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950">
                  <Image
                    src={cover}
                    alt={album.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  <div className="absolute top-3.5 right-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-mono text-zinc-200 border border-white/15">
                      <Images className="h-3.5 w-3.5 text-purple-400" />
                      {album.photoCount || 0} ตัวอย่าง
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                  <div>
                    <h3 className="font-serif text-xl font-medium text-white group-hover:text-purple-200 transition-colors line-clamp-1">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="mt-2 text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed font-light">
                        {album.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] text-xs font-mono text-zinc-300 group-hover:text-white transition-colors">
                    <span className="text-purple-400 font-semibold group-hover:underline">
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
      <footer className="border-t border-white/[0.08] bg-black/60 py-10 mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-zinc-400">
          <div>© {new Date().getFullYear()} F-SECRET AI ART. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">หน้าแรก</Link>
            <Link href="/admin" className="hover:text-white transition-colors">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
