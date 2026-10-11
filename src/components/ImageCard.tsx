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

function getOptimizedPhotoUrl(url: string, width = 600, height = 900): string {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (url.includes('/upload/c_') || url.includes('/upload/w_')) {
      return url.replace(/\/upload\/(?:c_[^/]+|w_[^/]+)[^/]*\//, `/upload/c_limit,w_${width},h_${height},q_auto:eco,f_auto/`);
    }
    return url.replace('/image/upload/', `/image/upload/c_limit,w_${width},h_${height},q_auto:eco,f_auto/`);
  }
  return url;
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

  const rawUrl = photo.thumbUrl || photo.previewUrl || photo.originalUrl;
  const optimizedSrc = getOptimizedPhotoUrl(rawUrl, 600, 900);

  // Micro-stagger for initial viewport photos (0ms to 280ms)
  const staggerDelay = index < 8 ? `${(index % 8) * 35}ms` : '0ms';

  return (
    <div
      className="cv-auto group relative overflow-hidden rounded-xl sm:rounded-2xl bg-[#141014] border border-amber-500/15 transition-all duration-300 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/15 cursor-pointer select-none active:scale-[0.98]"
      onClick={onClick}
    >
      {/* 2:3 Aspect ratio portrait card (Uniform & elegant, matching mobile 2-column view) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0d0b0f]">
        
        {/* 1. Amber-Gold Luxury Shimmer Skeleton: Active until this photo loads */}
        {!loaded && !hasError && (
          <div className="absolute inset-0 z-0 overflow-hidden bg-[#151118]">
            {/* Subtle warm base pulse */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-stone-900/60 to-stone-950 animate-pulse" />
            {/* Diagonal shimmer beam */}
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-amber-400/12 to-transparent" />
          </div>
        )}

        {/* 2. Low-Quality Blur Placeholder: Softly cross-fades out when loaded */}
        {photo.blurDataUrl && !hasError && (
          <img
            src={photo.blurDataUrl}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover filter blur-md scale-110 pointer-events-none transition-opacity duration-700 ease-out ${
              loaded ? 'opacity-0' : 'opacity-80'
            }`}
          />
        )}

        {/* 3. Error Fallback */}
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0e0c0f] p-4 text-center text-stone-500">
            <AlertCircle className="h-6 w-6 text-stone-600 mb-1" />
            <span className="text-[10px] font-mono">รูปภาพไม่พร้อมใช้งาน</span>
          </div>
        ) : (
          /* 4. Main Photo: Independent, smooth cinematic reveal as soon as it arrives */
          <Image
            src={optimizedSrc}
            alt={photo.originalName || 'Gallery Photo'}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading={index < 8 ? 'eager' : 'lazy'}
            priority={index < 4}
            onLoad={() => setLoaded(true)}
            onError={() => setHasError(true)}
            style={{ transitionDelay: staggerDelay }}
            className={`object-cover transform transition-all duration-700 ease-out group-hover:scale-105 ${
              loaded
                ? 'opacity-100 scale-100 blur-0 translate-y-0'
                : 'opacity-0 scale-105 blur-sm translate-y-1'
            }`}
          />
        )}

        {/* Hover / Touch Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a0d]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

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
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/40 opacity-100'
                : 'bg-black/60 text-stone-200 hover:bg-black/90 hover:text-white border border-amber-500/25 opacity-0 group-hover:opacity-100'
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
