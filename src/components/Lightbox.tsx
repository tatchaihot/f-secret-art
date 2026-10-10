'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Heart, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { Photo } from '@/lib/db';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function Lightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  isFavorite = false,
  onToggleFavorite,
}: LightboxProps) {
  const currentPhoto = photos[currentIndex];
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchDelta, setTouchDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setImgLoaded(false);
      setHasError(false);
      setIsZoomed(false);
      setPanOffset({ x: 0, y: 0 });
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setImgLoaded(false);
      setHasError(false);
      setIsZoomed(false);
      setPanOffset({ x: 0, y: 0 });
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const toggleZoom = () => {
    setIsZoomed((prev) => {
      if (prev) {
        setPanOffset({ x: 0, y: 0 });
      }
      return !prev;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Touch gesture handling (Swipe navigation + Pan when zoomed)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setTouchDelta({ x: 0, y: 0 });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStart.x;
    const deltaY = currentY - touchStart.y;

    if (isZoomed) {
      // Free panning when zoomed in
      setPanOffset((prev) => ({
        x: prev.x + deltaX * 0.5,
        y: prev.y + deltaY * 0.5,
      }));
      setTouchStart({ x: currentX, y: currentY });
    } else {
      setTouchDelta({ x: deltaX, y: deltaY });
    }
  };

  const onTouchEnd = () => {
    if (isZoomed) {
      setTouchStart(null);
      return;
    }
    if (!touchStart) return;

    const minSwipeDistance = 45;
    const { x, y } = touchDelta;

    // Vertical swipe down to close (forgiving diagonal threshold)
    if (y > 90 && Math.abs(x) < 130) {
      onClose();
    }
    // Horizontal swipe for next/prev
    else if (x < -minSwipeDistance && Math.abs(y) < 130) {
      handleNext();
    } else if (x > minSwipeDistance && Math.abs(y) < 130) {
      handlePrev();
    }

    setTouchStart(null);
    setTouchDelta({ x: 0, y: 0 });
  };

  if (!isOpen || !currentPhoto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl transition-all duration-300 select-none animate-fade-in"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Header Controls Bar */}
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
        {/* Photo Counter */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs sm:text-sm tracking-widest text-zinc-400">
            <span className="text-white font-medium">
              {String(currentIndex + 1).padStart(2, '0')}
            </span>
            {' / '}
            {String(photos.length).padStart(2, '0')}
          </span>
          <span className="hidden sm:inline-block h-3 w-[1px] bg-zinc-700" />
          <span className="hidden sm:inline-block font-mono text-xs text-zinc-400 truncate max-w-xs">
            {currentPhoto.originalName}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={toggleZoom}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
            title={isZoomed ? 'Zoom out (ย่อ)' : 'Zoom in (ขยาย)'}
          >
            {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </button>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(currentPhoto.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                isFavorite
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40'
                  : 'bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white'
              }`}
              title={isFavorite ? 'Remove favorite' : 'Add to favorites'}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-white' : ''}`} />
            </button>
          )}

          {/* Download Original Photo */}
          <a
            href={currentPhoto.originalUrl}
            download={currentPhoto.originalName}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
            title="Download full-resolution photo"
          >
            <Download className="h-4 w-4" />
          </a>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors ml-2"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div
        className="relative flex h-full w-full items-center justify-center p-2 sm:p-8 overflow-hidden"
        style={{
          transform: !isZoomed
            ? `translate(${touchDelta.x * 0.3}px, ${touchDelta.y * 0.5}px)`
            : `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: touchStart ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {/* Placeholder / Blur background while high-res loads */}
        {currentPhoto.blurDataUrl && !imgLoaded && !hasError && (
          <img
            src={currentPhoto.blurDataUrl}
            alt=""
            className="absolute max-h-[90vh] max-w-[90vw] object-contain filter blur-md opacity-40"
          />
        )}

        {hasError ? (
          <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl glass-panel border border-white/10 text-zinc-400 space-y-2">
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <p className="text-sm font-mono text-zinc-200">ไม่สามารถโหลดรูปภาพได้</p>
            <p className="text-xs text-zinc-500 font-mono">โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>
          </div>
        ) : (
          <img
            key={currentPhoto.id}
            src={currentPhoto.previewUrl || currentPhoto.originalUrl}
            alt={currentPhoto.originalName}
            onLoad={() => setImgLoaded(true)}
            onError={() => setHasError(true)}
            className={`max-h-[85vh] max-w-[95vw] sm:max-h-[90vh] sm:max-w-[85vw] object-contain transition-all duration-300 select-none ${
              isZoomed ? 'scale-150 cursor-grab active:cursor-grabbing' : 'scale-100'
            } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            draggable={false}
          />
        )}
      </div>

      {/* Navigation Buttons (Both Mobile & Desktop) */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 sm:bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-105 border border-white/15"
          title="Previous photo (รูปก่อนหน้า)"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-black/60 sm:bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-105 border border-white/15"
          title="Next photo (รูปถัดไป)"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      {/* Mobile Swipe Guidance Indicator */}
      <div className="sm:hidden absolute bottom-4 inset-x-0 text-center pointer-events-none">
        <span className="text-[11px] font-mono tracking-wider text-zinc-300 bg-black/80 px-3.5 py-1.5 rounded-full border border-white/15 shadow-xl">
          {isZoomed ? '👆 ใช้นิ้วลากเลื่อนดูส่วนต่างๆ ของภาพ' : '👉 ใช้นิ้วปัดซ้าย-ขวา เพื่อเลื่อนดูรูป · ปัดลงเพื่อปิด'}
        </span>
      </div>
    </div>
  );
}
