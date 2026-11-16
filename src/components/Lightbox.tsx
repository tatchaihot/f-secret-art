'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Heart, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { Photo } from '@/lib/db';
import { useModalBackHandler } from '@/lib/useModalBackHandler';

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
  const lastTapRef = useRef<number>(0);
  const ignoreTouchRef = useRef<boolean>(false);

  const handleCloseReset = useCallback(() => {
    setIsZoomed(false);
    setPanOffset({ x: 0, y: 0 });
    setTouchStart(null);
    setTouchDelta({ x: 0, y: 0 });
    onClose();
  }, [onClose]);

  const requestClose = useModalBackHandler(isOpen, handleCloseReset, 'lightbox');

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

  const toggleZoom = useCallback(() => {
    setIsZoomed((prev) => {
      if (prev) {
        setPanOffset({ x: 0, y: 0 });
      }
      return !prev;
    });
  }, []);

  // Preload adjacent photos for instant swipe transitions
  useEffect(() => {
    if (!isOpen) return;
    const neighbors = [photos[currentIndex + 1], photos[currentIndex - 1]];
    for (const neighbor of neighbors) {
      if (!neighbor) continue;
      const url = neighbor.previewUrl || neighbor.originalUrl;
      if (url) {
        const preloader = new window.Image();
        preloader.src = url;
      }
    }
  }, [isOpen, currentIndex, photos]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, requestClose, handleNext, handlePrev]);

  // Touch gesture handling (Swipe Left/Right/Up to navigate, Swipe Down to close, Pan when zoomed)
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;

    // Leave 20px screen edges clear so OS edge-back gesture works without fighting lightbox swipe
    if (!isZoomed && (clientX < 20 || clientX > window.innerWidth - 20)) {
      ignoreTouchRef.current = true;
      setTouchStart(null);
      return;
    }

    ignoreTouchRef.current = false;
    setTouchStart({ x: clientX, y: clientY });
    setTouchDelta({ x: 0, y: 0 });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (ignoreTouchRef.current || !touchStart || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStart.x;
    const deltaY = currentY - touchStart.y;

    if (isZoomed) {
      setPanOffset((prev) => ({
        x: prev.x + deltaX * 0.65,
        y: prev.y + deltaY * 0.65,
      }));
      setTouchStart({ x: currentX, y: currentY });
    } else {
      setTouchDelta({ x: deltaX, y: deltaY });
    }
  };

  const onTouchEnd = () => {
    if (ignoreTouchRef.current) {
      ignoreTouchRef.current = false;
      return;
    }

    if (isZoomed) {
      // Double-tap detection while zoomed to zoom out
      if (Math.abs(touchDelta.x) < 8 && Math.abs(touchDelta.y) < 8) {
        const now = Date.now();
        if (now - lastTapRef.current < 280) {
          toggleZoom();
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
        }
      }
      setTouchStart(null);
      setTouchDelta({ x: 0, y: 0 });
      return;
    }

    if (!touchStart) return;

    const minSwipeDistance = 45;
    const { x, y } = touchDelta;
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    // Tap (no drag): check double-tap to zoom
    if (absX < 8 && absY < 8) {
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        toggleZoom();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    } else if (absX >= absY) {
      // Dominant horizontal swipe
      if (x < -minSwipeDistance) {
        handleNext();
      } else if (x > minSwipeDistance) {
        handlePrev();
      }
    } else {
      // Dominant vertical swipe: Up -> Next photo, Down -> Close
      if (y < -minSwipeDistance) {
        handleNext();
      } else if (y > 85) {
        requestClose();
      }
    }

    setTouchStart(null);
    setTouchDelta({ x: 0, y: 0 });
  };

  if (!isOpen || !currentPhoto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`ภาพที่ ${currentIndex + 1} จาก ${photos.length}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0a0d]/95 backdrop-blur-2xl transition-all duration-300 select-none animate-fade-in overscroll-contain touch-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Header Controls Bar */}
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-[#0b0a0d]/95 via-[#0b0a0d]/50 to-transparent pointer-events-auto">
        {/* Photo Counter */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs sm:text-sm tracking-widest text-stone-400">
            <span className="text-amber-300 font-semibold">
              #{String(currentIndex + 1).padStart(2, '0')}
            </span>
            {' / '}
            {String(photos.length).padStart(2, '0')}
          </span>
          <span className="hidden sm:inline-block h-3 w-[1px] bg-amber-500/25" />
          <span className="hidden sm:inline-block font-mono text-xs text-stone-400 truncate max-w-xs">
            {currentPhoto.originalName}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={toggleZoom}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/70 hover:bg-amber-500/20 text-stone-300 hover:text-white border border-amber-500/20 transition-all"
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
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/40'
                  : 'bg-stone-900/70 hover:bg-amber-500/20 text-stone-300 hover:text-white border border-amber-500/20'
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/70 hover:bg-amber-500/20 text-stone-300 hover:text-white border border-amber-500/20 transition-all"
            title="Download full-resolution photo"
          >
            <Download className="h-4 w-4" />
          </a>

          {/* Close Button */}
          <button
            type="button"
            onClick={requestClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/70 hover:bg-amber-500/20 text-stone-300 hover:text-white border border-amber-500/20 transition-all ml-1 sm:ml-2"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div
        onClick={(e) => {
          if (!isZoomed && e.target === e.currentTarget) {
            requestClose();
          }
        }}
        onDoubleClick={toggleZoom}
        className="relative flex h-full w-full items-center justify-center p-2 sm:p-8 overflow-hidden"
        style={{
          transform: !isZoomed
            ? `translate(${touchDelta.x * 0.35}px, ${touchDelta.y * 0.45}px)`
            : `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: touchStart ? 'none' : 'transform 0.28s ease-out',
        }}
      >
        {/* Placeholder / Blur background while high-res loads */}
        {currentPhoto.blurDataUrl && !imgLoaded && !hasError && (
          <img
            src={currentPhoto.blurDataUrl}
            alt=""
            className="absolute max-h-[90vh] max-w-[90vw] object-contain filter blur-md opacity-40 pointer-events-none"
          />
        )}

        {hasError ? (
          <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl glass-panel border border-amber-500/20 text-stone-400 space-y-2">
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <p className="text-sm font-mono text-stone-200">ไม่สามารถโหลดรูปภาพได้</p>
            <p className="text-xs text-stone-500 font-mono">โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>
          </div>
        ) : (
          <img
            key={currentPhoto.id}
            src={currentPhoto.previewUrl || currentPhoto.originalUrl}
            alt={currentPhoto.originalName}
            onLoad={() => setImgLoaded(true)}
            onError={() => setHasError(true)}
            className={`max-h-[85vh] max-w-[95vw] sm:max-h-[90vh] sm:max-w-[85vw] object-contain transition-all duration-300 select-none ${
              isZoomed ? 'scale-150 cursor-grab active:cursor-grabbing' : 'scale-100 cursor-zoom-in'
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
          className="flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-stone-900/80 hover:bg-amber-500/20 text-white backdrop-blur-md transition-all hover:scale-105 border border-amber-500/30"
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
          className="flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-stone-900/80 hover:bg-amber-500/20 text-white backdrop-blur-md transition-all hover:scale-105 border border-amber-500/30"
          title="Next photo (รูปถัดไป)"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      {/* Mobile Swipe Guidance Indicator */}
      <div className="sm:hidden absolute bottom-4 inset-x-0 text-center pointer-events-none px-3">
        <span className="inline-block text-[11px] font-mono tracking-wide text-amber-200/90 bg-[#0b0a0d]/90 px-3.5 py-1.5 rounded-full border border-amber-500/30 shadow-xl">
          {isZoomed
            ? '👆 ลากเลื่อนดูภาพ · แตะ 2 ครั้งเพื่อย่อ'
            : '👉 ปัดซ้าย-ขวา หรือปัดขึ้นดูรูปถัดไป · ปัดลงเพื่อปิด'}
        </span>
      </div>
    </div>
  );
}
