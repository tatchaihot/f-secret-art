'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUp, Search, X } from 'lucide-react';
import { Album } from '@/lib/db';
import AlbumCoverGrid from '@/components/AlbumCoverGrid';

interface CatalogBrowserProps {
  albums: Album[];
}

export default function CatalogBrowser({ albums }: CatalogBrowserProps) {
  const [query, setQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filteredAlbums = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return albums;
    return albums.filter((album) => {
      const title = album.title?.toLowerCase() || '';
      const desc = album.description?.toLowerCase() || '';
      const tag = album.clientName?.toLowerCase() || '';
      return title.includes(q) || desc.includes(q) || tag.includes(q);
    });
  }, [albums, query]);

  const scrollToTop = () => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
  };

  return (
    <div className="space-y-8">
      {albums.length > 4 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/70 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาสไตล์ที่ต้องการ เช่น ชุดราตรี, คอสเพลย์, วันเกิด..."
            className="w-full rounded-full border border-amber-500/25 bg-[#141016]/90 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-stone-500 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/30 font-mono"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="ล้างคำค้นหา"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {filteredAlbums.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-500/20 bg-[#120f14]/50 p-12 text-center space-y-3">
          <p className="text-sm font-mono text-stone-300">
            ไม่พบสไตล์ที่ตรงกับคำค้นหา &ldquo;{query}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="rounded-full border border-amber-500/35 bg-amber-500/15 px-4 py-1.5 text-xs font-mono text-amber-200 hover:bg-amber-500/25"
          >
            แสดงสไตล์ทั้งหมด ({albums.length})
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAlbums.map((album, idx) => (
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
                priority={idx < 3}
              />

              <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                <div>
                  <h3 className="font-serif text-xl font-medium text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {album.title}
                  </h3>
                  {album.description && (
                    <p className="mt-2 text-xs sm:text-sm text-stone-400 line-clamp-3 whitespace-pre-line leading-relaxed font-light">
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
          ))}
        </div>
      )}

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-[#0e0c10]/92 backdrop-blur-xl px-4 py-2.5 font-mono text-xs text-amber-200 shadow-2xl shadow-black/80 hover:bg-amber-500/20 transition-all animate-fade-in"
          title="เลื่อนกลับขึ้นด้านบนสุด"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          <span>ขึ้นด้านบน</span>
        </button>
      )}
    </div>
  );
}
