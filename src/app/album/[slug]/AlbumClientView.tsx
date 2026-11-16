'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUp, Layers, Lock, Heart, Share2, Check, MessageCircle } from 'lucide-react';
import ImageCard from '@/components/ImageCard';
import Lightbox from '@/components/Lightbox';
import { Album, Photo } from '@/lib/db';

interface AlbumClientViewProps {
  album: Album & { photos: Photo[] };
}

export default function AlbumClientView({ album }: AlbumClientViewProps) {
  // Passcode gate for private albums
  const [isUnlocked, setIsUnlocked] = useState(album.isPrivate === 0);
  const [inputPasscode, setInputPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Client Favorites state (persisted to localStorage)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFloatingNav, setShowFloatingNav] = useState(false);

  const photoNumberById = useMemo(() => {
    const map = new Map<string, number>();
    album.photos.forEach((p, idx) => map.set(p.id, idx + 1));
    return map;
  }, [album.photos]);

  useEffect(() => {
    const onScroll = () => {
      setShowFloatingNav(window.scrollY > 320);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Load favorites from localStorage
    const saved = localStorage.getItem(`fav_${album.id}`);
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        // ignore JSON parse error
      }
    }

    // Check if passcode was already unlocked previously
    if (album.isPrivate === 1 && album.passcode) {
      const unlockedToken = sessionStorage.getItem(`unlock_${album.id}`);
      if (unlockedToken === album.passcode) {
        setIsUnlocked(true);
      }
    }
  }, [album.id, album.isPrivate, album.passcode]);

  const handleToggleFavorite = (photoId: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId];
      localStorage.setItem(`fav_${album.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPasscode === album.passcode) {
      setIsUnlocked(true);
      setPasscodeError(false);
      sessionStorage.setItem(`unlock_${album.id}`, inputPasscode);
    } else {
      setPasscodeError(true);
    }
  };

  const [lineCopied, setLineCopied] = useState(false);

  const handleOrderViaLine = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const favNumbers = favorites
      .map((id) => photoNumberById.get(id))
      .filter((n): n is number => typeof n === 'number')
      .sort((a, b) => a - b)
      .map((n) => `#${String(n).padStart(2, '0')}`);

    const favDetail = favNumbers.length > 0 ? ` (รูปที่ชอบ: ${favNumbers.join(', ')})` : '';
    const text = `สวัสดีค่ะ สนใจสั่งทำภาพ AI สไตล์ "${album.title}"${favDetail} ค่ะ (ลิงก์: ${currentUrl})`;
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setLineCopied(true);
      setTimeout(() => setLineCopied(false), 3000);
    }
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank');
  };

  const scrollToTop = () => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Filtered photos based on "Favorites Only"
  const displayedPhotos = filterFavorites
    ? album.photos.filter((p) => favorites.includes(p.id))
    : album.photos;

  // Private Passcode Modal Screen
  if (!isUnlocked) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-500/25 bg-[#141015]/95 p-8 backdrop-blur-xl text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/25">
            <Lock className="h-5 w-5 text-amber-400" />
          </div>
          <h2 className="font-serif text-2xl font-normal text-white">Private Gallery</h2>
          <p className="mt-2 text-xs text-stone-400 font-mono">
            {album.title} — Restricted Client Access
          </p>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <div>
              <input
                type="password"
                value={inputPasscode}
                onChange={(e) => setInputPasscode(e.target.value)}
                placeholder="Enter client passcode"
                className="w-full rounded-lg border border-amber-500/20 bg-stone-900/80 px-4 py-3 text-center text-sm font-mono tracking-widest text-white placeholder-stone-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all"
                autoFocus
              />
              {passcodeError && (
                <p className="mt-2 text-xs font-mono text-rose-400">
                  รหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้งนะคะ
                </p>
              )}
            </div>
            <button
              type="submit"
              className="btn-gold w-full rounded-lg py-3 text-xs font-mono uppercase tracking-widest font-semibold"
            >
              Unlock Gallery
            </button>
          </form>

          <div className="mt-6">
            <Link
              href="/galleries"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-stone-500 hover:text-amber-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> กลับสู่รวมแคตตาล็อกสไตล์
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-8 sm:py-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-amber-500/15">
        <Link
          href="/galleries"
          className="group inline-flex items-center gap-1.5 sm:gap-2 font-mono text-xs text-stone-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 transform transition-transform group-hover:-translate-x-1" />
          <span>รวมแคตตาล็อกสไตล์</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Order this style via LINE with automatic style name context */}
          <button
            type="button"
            onClick={handleOrderViaLine}
            className="flex items-center gap-1.5 rounded-full bg-[#06C755] hover:bg-[#05b34c] px-4 py-2 font-mono text-xs text-white font-semibold shadow-md shadow-[#06C755]/20 hover:scale-105 transition-all cursor-pointer"
            title="กดเพื่อเปิด LINE พร้อมแนบชื่อสไตล์นี้โดยอัตโนมัติ"
          >
            <MessageCircle className="h-3.5 w-3.5 fill-current" />
            <span className="hidden sm:inline">{lineCopied ? 'คัดลอกข้อความแล้ว!' : 'สั่งทำสไตล์นี้'}</span>
            <span>(LINE)</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-stone-900/60 hover:bg-amber-500/10 hover:border-amber-500/40 px-3 py-1.5 font-mono text-xs text-stone-300 hover:text-white transition-all shadow-sm"
          >
            {copiedLink ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3 w-3" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Album Editorial Header */}
      <div className="py-10 space-y-4 max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          {album.clientName && (
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
              Client: {album.clientName}
            </span>
          )}
          {album.eventDate && (
            <span className="font-mono text-xs tracking-wider text-zinc-500">
              {album.eventDate}
            </span>
          )}
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-white">
          {album.title}
        </h1>

        {album.description && (
          <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed whitespace-pre-line">
            {album.description}
          </p>
        )}
      </div>

      {/* Filter & Sticky Navigation Toolbar */}
      <div className="sticky top-16 z-30 -mx-3 px-3 sm:mx-0 sm:px-4 flex flex-wrap items-center justify-between gap-2 border-y border-amber-500/15 bg-[#0b0a0d]/92 backdrop-blur-xl py-3 mb-8 sm:rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
          <Link
            href="/galleries"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-stone-900/75 hover:bg-amber-500/15 px-3 py-1.5 font-mono text-xs text-amber-200 transition-colors"
            title="กลับไปหน้ารวมอัลบั้มทั้งหมด"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>รวมอัลบั้ม</span>
          </Link>

          <span className="hidden sm:inline-block h-4 w-[1px] bg-amber-500/20" />

          <button
            type="button"
            onClick={() => setFilterFavorites(false)}
            className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
              !filterFavorites
                ? 'btn-gold font-medium shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            ทั้งหมด ({album.photos.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterFavorites(true)}
            className={`flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
              filterFavorites
                ? 'bg-rose-500 text-white font-medium shadow-md shadow-rose-500/30'
                : 'text-stone-400 hover:text-rose-400'
            }`}
          >
            <Heart className={`h-3 w-3 ${favorites.length > 0 ? 'fill-current' : ''}`} />
            ที่ชอบ ({favorites.length})
          </button>
        </div>

        <span className="hidden md:inline font-mono text-[11px] text-stone-400">
          แตะรูปเพื่อดูเต็มจอ · กดหัวใจเพื่อเลือกรูปส่ง LINE
        </span>
      </div>

      {/* 2-Column Mobile Grid for easy browsing & instant fullscreen lightbox */}
      {displayedPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-500/20 p-16 text-center bg-[#120f14]/40">
          <Heart className="h-10 w-10 text-stone-600 mb-3" />
          <p className="text-sm font-mono text-stone-400">
            {filterFavorites
              ? 'ยังไม่มีรูปที่ถูกเลือกเป็น Favorite กดที่รูปหัวใจเพื่อบันทึกรูปที่ชอบได้เลยนะคะ'
              : 'ยังไม่มีรูปภาพในอัลบั้มนี้'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3.5 md:gap-4">
            {displayedPhotos.map((photo, index) => (
              <ImageCard
                key={photo.id}
                photo={photo}
                index={index}
                photoNumber={photoNumberById.get(photo.id)}
                isFavorite={favorites.includes(photo.id)}
                onToggleFavorite={handleToggleFavorite}
                onClick={() => {
                  setActivePhotoIndex(index);
                  setLightboxOpen(true);
                }}
              />
            ))}
          </div>

          {/* End-of-Album Navigation Card */}
          <div className="mt-12 rounded-2xl border border-amber-500/20 bg-[#120f14]/70 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-serif text-base sm:text-lg text-white">
                ดูภาพครบทั้งหมดแล้ว ({displayedPhotos.length} ภาพ)
              </p>
              <p className="text-xs font-mono text-stone-400 mt-1">
                {favorites.length > 0
                  ? `เลือกไว้แล้ว ${favorites.length} รูป กดสั่งทำทาง LINE เพื่อส่งเลขรูปให้อัตโนมัติได้เลยค่ะ`
                  : 'สามารถเลือกดูสไตล์อื่นต่อ หรือกดสั่งทำสไตล์นี้ทาง LINE ได้ทันทีค่ะ'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/galleries"
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/15 hover:bg-amber-500/25 px-5 py-2.5 font-mono text-xs text-amber-200 transition-all"
              >
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                <span>กลับไปเลือกดูสไตล์อื่นทั้งหมด</span>
              </Link>

              <button
                type="button"
                onClick={handleOrderViaLine}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755] hover:bg-[#05b34c] px-5 py-2.5 font-mono text-xs text-white font-semibold shadow-md shadow-[#06C755]/25 transition-all cursor-pointer"
              >
                <MessageCircle className="h-3.5 w-3.5 fill-current" />
                <span>สั่งทำสไตล์นี้ (LINE)</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Floating Quick-Back & Scroll-to-Top Pill (Desktop + Mobile when scrolled) */}
      {showFloatingNav && !lightboxOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 rounded-full border border-amber-500/35 bg-[#0e0c10]/92 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/80 animate-fade-in">
          <Link
            href="/galleries"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-3.5 py-2 font-mono text-xs text-amber-200 transition-colors"
            title="กลับไปหน้ารวมแคตตาล็อกอัลบั้มทั้งหมด"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>รวมอัลบั้ม</span>
          </Link>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 px-3 py-2 font-mono text-xs text-stone-200 transition-colors"
            title="เลื่อนกลับขึ้นด้านบนสุด"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">บนสุด</span>
          </button>
        </div>
      )}

      {/* Fullscreen Mobile-First Lightbox with Gestures */}
      <Lightbox
        photos={displayedPhotos}
        currentIndex={activePhotoIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(newIndex) => setActivePhotoIndex(newIndex)}
        isFavorite={
          displayedPhotos[activePhotoIndex]
            ? favorites.includes(displayedPhotos[activePhotoIndex].id)
            : false
        }
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
