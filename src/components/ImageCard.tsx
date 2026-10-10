'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Maximize2 } from 'lucide-react';
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

  const aspectRatio = photo.width && photo.height ? photo.width / photo.height : 1.5;

  return (
    <div
      className="group relative mb-4 break-inside-avoid overflow-hidden rounded-lg bg-zinc-900/60 border border-white/[0.04] transition-all hover:border-white/20 cv-auto cursor-pointer"
      onClick={onClick}
    >
      {/* Aspect Ratio Skeleton Container to prevent any Layout Shift (CLS = 0) */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        {/* Progressive Blur Placeholder */}
        {photo.blurDataUrl && !loaded && (
          <img
            src={photo.blurDataUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover filter blur-lg scale-110 opacity-70 transition-opacity duration-700"
          />
        )}

        {/* Optimized WebP Thumbnail Image */}
        <Image
          src={photo.thumbUrl || photo.originalUrl}
          alt={photo.originalName || 'Gallery Photo'}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading={index < 3 ? 'eager' : 'lazy'}
          priority={index < 2}
          onLoad={() => setLoaded(true)}
          className={`object-cover transition-all duration-700 ease-out group-hover:scale-[1.02] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Hover / Touch Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Top Badges & Actions */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(photo.id);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                isFavorite
                  ? 'bg-rose-500/90 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-black/50 text-zinc-300 hover:bg-black/80 hover:text-white'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-white' : ''}`} />
            </button>
          )}

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-zinc-300 group-hover:text-white">
            <Maximize2 className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Bottom Filename / Index info on hover */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <p className="truncate text-xs font-mono text-zinc-200 drop-shadow">
            {photo.originalName}
          </p>
        </div>
      </div>
    </div>
  );
}
