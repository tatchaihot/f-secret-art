'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Images } from 'lucide-react';

interface AlbumCoverGridProps {
  previewPhotos?: string[];
  coverImage?: string | null;
  title: string;
  photoCount?: number;
  priority?: boolean;
}

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

/**
 * Generates lightweight edge-transformed Cloudinary thumbnail URLs.
 * Keeps payload ~14KB per image instead of 5-8MB, bypassing Next.js server proxy.
 */
function getOptimizedThumb(url: string, width = 360, height = 270): string {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (url.includes('/upload/c_') || url.includes('/upload/w_')) {
      return url.replace(/\/upload\/(?:c_[^/]+|w_[^/]+)[^/]*\//, `/upload/c_fill,w_${width},h_${height},g_auto,q_auto:eco,f_auto/`);
    }
    return url.replace('/image/upload/', `/image/upload/c_fill,w_${width},h_${height},g_auto,q_auto:eco,f_auto/`);
  }
  return url;
}

/**
 * Resilient thumbnail image with auto fallback and graceful error state
 */
function CoverThumb({
  url,
  alt,
  width,
  height,
  priority,
  sizes,
}: {
  url: string;
  alt: string;
  width: number;
  height: number;
  priority: boolean;
  sizes: string;
}) {
  const [src, setSrc] = useState(getOptimizedThumb(url, width, height));
  const [error, setError] = useState(false);

  if (error || !url) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-stone-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-stone-900 to-stone-950" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      sizes={sizes}
      onError={() => {
        // If transformed URL fails, try raw url, otherwise fail gracefully without broken icon
        if (src !== url && url.startsWith('http')) {
          setSrc(url);
        } else {
          setError(true);
        }
      }}
      className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
    />
  );
}

export default function AlbumCoverGrid({
  previewPhotos = [],
  coverImage,
  title,
  photoCount = 0,
  priority = false,
}: AlbumCoverGridProps) {
  // Collect all verified photos, filtering out local /uploads/ or invalid strings
  const candidateList = [...previewPhotos];
  if (
    coverImage &&
    typeof coverImage === 'string' &&
    coverImage.startsWith('http') &&
    !candidateList.includes(coverImage)
  ) {
    candidateList.unshift(coverImage);
  }

  const validPhotos = candidateList.filter(
    (u) => typeof u === 'string' && u.trim().length > 0 && !u.startsWith('/uploads/')
  );

  const photos = validPhotos.length > 0 ? validPhotos.slice(0, 4) : [DEFAULT_COVER];

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-950">
      {/* 4-Photo Quad Grid (2x2) */}
      {photos.length >= 4 ? (
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-[2px] bg-[#0b0a0d]">
          {photos.map((url, i) => (
            <div key={i} className="relative h-full w-full overflow-hidden bg-stone-900">
              <CoverThumb
                url={url}
                alt={`${title} ตัวอย่างที่ ${i + 1}`}
                width={360}
                height={270}
                priority={priority && i < 2}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
              />
            </div>
          ))}
        </div>
      ) : photos.length === 3 ? (
        /* 3-Photo Layout: 1 Large Left + 2 Stacked Right */
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-[2px] bg-[#0b0a0d]">
          <div className="row-span-2 relative h-full w-full overflow-hidden bg-stone-900">
            <CoverThumb
              url={photos[0]}
              alt={`${title} ตัวอย่างที่ 1`}
              width={480}
              height={540}
              priority={priority}
              sizes="(max-width: 640px) 60vw, (max-width: 1024px) 30vw, 20vw"
            />
          </div>
          <div className="col-start-2 row-start-1 relative h-full w-full overflow-hidden bg-stone-900">
            <CoverThumb
              url={photos[1]}
              alt={`${title} ตัวอย่างที่ 2`}
              width={360}
              height={270}
              priority={priority}
              sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 15vw"
            />
          </div>
          <div className="col-start-2 row-start-2 relative h-full w-full overflow-hidden bg-stone-900">
            <CoverThumb
              url={photos[2]}
              alt={`${title} ตัวอย่างที่ 3`}
              width={360}
              height={270}
              priority={false}
              sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 15vw"
            />
          </div>
        </div>
      ) : photos.length === 2 ? (
        /* 2-Photo Split: 50% / 50% */
        <div className="grid grid-cols-2 h-full w-full gap-[2px] bg-[#0b0a0d]">
          {photos.map((url, i) => (
            <div key={i} className="relative h-full w-full overflow-hidden bg-stone-900">
              <CoverThumb
                url={url}
                alt={`${title} ตัวอย่างที่ ${i + 1}`}
                width={360}
                height={540}
                priority={priority}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
              />
            </div>
          ))}
        </div>
      ) : (
        /* Single Photo Full Cover */
        <div className="relative h-full w-full overflow-hidden bg-stone-900">
          <CoverThumb
            url={photos[0]}
            alt={title}
            width={640}
            height={480}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Dark warm vignette gradient overlay for text readability & luxury mood */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a0d] via-black/20 to-transparent pointer-events-none" />

      {/* Photo count badge */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0b0a0d]/85 backdrop-blur-md px-2.5 py-1 text-xs font-mono text-amber-200 border border-amber-500/30 shadow-md">
          <Images className="h-3.5 w-3.5 text-amber-400" />
          {photoCount} ตัวอย่าง
        </span>
      </div>
    </div>
  );
}
