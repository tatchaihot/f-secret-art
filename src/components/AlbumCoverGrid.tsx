import Image from 'next/image';
import { Images } from 'lucide-react';

interface AlbumCoverGridProps {
  previewPhotos?: string[];
  coverImage?: string | null;
  title: string;
  photoCount?: number;
}

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

export default function AlbumCoverGrid({
  previewPhotos = [],
  coverImage,
  title,
  photoCount = 0,
}: AlbumCoverGridProps) {
  // Build a distinct list of photos
  const rawList = [...previewPhotos];
  if (coverImage && !rawList.includes(coverImage)) {
    rawList.unshift(coverImage);
  }

  const photos = rawList.length > 0 ? rawList.slice(0, 4) : [DEFAULT_COVER];

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-950">
      {/* 4-Photo Quad Grid (2x2) */}
      {photos.length >= 4 ? (
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-[2px] bg-[#0b0a0d]">
          {photos.map((url, i) => (
            <div key={i} className="relative h-full w-full overflow-hidden bg-stone-900">
              <Image
                src={url}
                alt={`${title} ตัวอย่างที่ ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />
            </div>
          ))}
        </div>
      ) : photos.length === 3 ? (
        /* 3-Photo Layout: 1 Large Left + 2 Stacked Right */
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-[2px] bg-[#0b0a0d]">
          <div className="row-span-2 relative h-full w-full overflow-hidden bg-stone-900">
            <Image
              src={photos[0]}
              alt={`${title} ตัวอย่างที่ 1`}
              fill
              sizes="(max-width: 640px) 60vw, (max-width: 1024px) 30vw, 20vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            />
          </div>
          <div className="col-start-2 row-start-1 relative h-full w-full overflow-hidden bg-stone-900">
            <Image
              src={photos[1]}
              alt={`${title} ตัวอย่างที่ 2`}
              fill
              sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 15vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            />
          </div>
          <div className="col-start-2 row-start-2 relative h-full w-full overflow-hidden bg-stone-900">
            <Image
              src={photos[2]}
              alt={`${title} ตัวอย่างที่ 3`}
              fill
              sizes="(max-width: 640px) 40vw, (max-width: 1024px) 20vw, 15vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            />
          </div>
        </div>
      ) : photos.length === 2 ? (
        /* 2-Photo Split: 50% / 50% */
        <div className="grid grid-cols-2 h-full w-full gap-[2px] bg-[#0b0a0d]">
          {photos.map((url, i) => (
            <div key={i} className="relative h-full w-full overflow-hidden bg-stone-900">
              <Image
                src={url}
                alt={`${title} ตัวอย่างที่ ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 17vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />
            </div>
          ))}
        </div>
      ) : (
        /* Single Photo Full Cover */
        <div className="relative h-full w-full overflow-hidden bg-stone-900">
          <Image
            src={photos[0]}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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
