import Link from 'next/link';
import Image from 'next/image';
import { getAllAlbums, seedSampleData } from '@/lib/db';
import Navbar from '@/components/Navbar';
import { Lock, ArrowRight, Images, Calendar, User } from 'lucide-react';


export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Ensure sample demo data is seeded if database is fresh
  try {
    seedSampleData();
  } catch (e) {
    // Ignore seed check error
  }

  const albums = getAllAlbums();

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0b] text-zinc-100">
      <Navbar />

      <main className="flex-1">
        {/* Editorial Hero Statement */}
        <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-8 sm:pt-24 sm:pb-16">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] tracking-widest text-zinc-400 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Official Studio Archive
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.15]">
              Visual Stories Crafted with Precision & Light.
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-light max-w-2xl">
              พื้นที่จัดแสดงและส่งมอบผลงานภาพถ่ายคุณภาพสูงสำหรับลูกค้า พร้อมระบบแกลเลอรีความเร็วสูงเพื่อประสบการณ์รับชมที่ดีที่สุดบนทุกอุปกรณ์
            </p>
          </div>
        </section>

        {/* Albums Showcase Grid */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Selected Albums ({albums.length})
            </h2>
            <span className="text-xs font-mono text-zinc-400">
              Updated Live
            </span>
          </div>

          {albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-16 text-center">
              <Images className="h-12 w-12 text-zinc-600 mb-4" />
              <h3 className="text-lg font-medium text-zinc-300">ยังไม่มีอัลบั้มในระบบ</h3>
              <p className="mt-1 text-sm text-zinc-500 max-w-sm">
                เข้าสู่ระบบหลังบ้านเพื่อสร้างอัลบั้มแรกและอัปโหลดภาพถ่ายของคุณ
              </p>
              <Link
                href="/admin"
                className="mt-6 rounded-full bg-white px-5 py-2 text-xs font-mono uppercase tracking-wider text-black hover:bg-zinc-200 transition-colors"
              >
                เข้าสู่หลังบ้าน (Admin)
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((album) => {
                const cover = album.coverImage || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80';

                return (
                  <Link
                    key={album.id}
                    href={`/album/${album.slug}`}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-950/60 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50"
                  >
                    {/* Cover Image Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                      <Image
                        src={cover}
                        alt={album.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Badges on top */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-zinc-300 border border-white/10">
                          <Images className="h-3 w-3" />
                          {album.photoCount || 0} Photos
                        </span>

                        {album.isPrivate === 1 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-amber-300 border border-amber-500/30">
                            <Lock className="h-3 w-3" /> Private
                          </span>
                        )}
                      </div>

                      {/* Shoot Date overlay on bottom of image */}
                      {album.eventDate && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-mono text-zinc-300">
                          <Calendar className="h-3 w-3 text-zinc-400" />
                          {album.eventDate}
                        </div>
                      )}
                    </div>

                    {/* Album Metadata & Title */}
                    <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                      <div>
                        {album.clientName && (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                            <User className="h-3 w-3" />
                            {album.clientName}
                          </div>
                        )}
                        <h3 className="font-serif text-lg font-medium text-white group-hover:text-zinc-200 transition-colors line-clamp-1">
                          {album.title}
                        </h3>
                        {album.description && (
                          <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {album.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs font-mono text-zinc-400 group-hover:text-white transition-colors">
                        <span>View Gallery</span>
                        <ArrowRight className="h-3.5 w-3.5 transform transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-white/[0.08] bg-black/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-zinc-400">
          <div>
            © {new Date().getFullYear()} LUMEN ATELIER. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">Galleries</Link>
            <Link href="/admin" className="hover:text-white transition-colors">Admin Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
