'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, AlertCircle } from 'lucide-react';
import { Photo } from '@/lib/db';

interface ImageCardProps {
  photo: Photo;
  index: number;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function ImageCard({
  photo,
  index,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}: ImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-zinc-900 border border-white/[0.06] transition-all hover:border-amber-500/40 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer select-none active:scale-[0.98]"
      onClick={onClick}
    >
      {/* 2:3 Aspect ratio portrait card (Uniform & elegant, matching mobile 2-column view) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        {/* Progressive Blur Placeholder */}
        {photo.blurDataUrl && !loaded && !hasError && (
          <img
            src={photo.blurDataUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover filter blur-lg scale-110 opacity-70 transition-opacity duration-700"
          />
        )}

        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-4 text-center text-zinc-500">
            <AlertCircle className="h-6 w-6 text-zinc-600 mb-1" />
            <span className="text-[10px] font-mono">รูปภาพไม่พร้อมใช้งาน</span>
          </div>
        ) : (
          <Image
            src={photo.thumbUrl || photo.previewUrl || photo.originalUrl}
            alt={photo.originalName || 'Gallery Photo'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading={index < 6 ? 'eager' : 'lazy'}
            priority={index < 2}
            onLoad={() => setLoaded(true)}
            onError={() => setHasError(true)}
            className={`object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Hover / Touch Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

        {/* Favorite Heart Button (Discreet, compact, doesn't block portrait) */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(photo.id);
            }}
            className={`absolute top-2 right-2 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-md active:scale-90 ${
              isFavorite
                ? 'bg-rose-500 text-white shadow-rose-500/40 opacity-100'
                : 'bg-black/50 text-white/80 hover:bg-black/80 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100'
            }`}
            title={isFavorite ? 'ลบออกจากรายการโปรด' : 'บันทึกรูปที่ชอบ'}
          >
            <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}
