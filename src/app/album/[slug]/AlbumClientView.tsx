'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Heart, Download, Share2, Check, Sparkles, Filter, MessageCircle } from 'lucide-react';
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
    const text = `สวัสดีครับ สนใจสั่งทำภาพ AI สไตล์ "${album.title}" ครับ (ลิงก์: ${currentUrl})`;
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setLineCopied(true);
      setTimeout(() => setLineCopied(false), 3000);
    }
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank');
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
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/80 p-8 backdrop-blur-xl text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10">
            <Lock className="h-5 w-5 text-amber-400" />
          </div>
          <h2 className="font-serif text-2xl font-normal text-white">Private Gallery</h2>
          <p className="mt-2 text-xs text-zinc-400 font-mono">
            {album.title} — Restricted Client Access
          </p>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <div>
              <input
                type="password"
                value={inputPasscode}
                onChange={(e) => setInputPasscode(e.target.value)}
                placeholder="Enter client passcode"
                className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-4 py-3 text-center text-sm font-mono tracking-widest text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all"
                autoFocus
              />
              {passcodeError && (
                <p className="mt-2 text-xs font-mono text-rose-400">
                  รหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-white py-3 text-xs font-mono uppercase tracking-widest text-black hover:bg-zinc-200 transition-colors font-semibold"
            >
              Unlock Gallery
            </button>
          </form>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to all galleries
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-mono text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 transform transition-transform group-hover:-translate-x-1" />
          <span>All Galleries</span>
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
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
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
          <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
            {album.description}
          </p>
        )}
      </div>

      {/* Filter & Toolbar */}
      <div className="sticky top-16 z-30 flex items-center justify-between border-y border-white/[0.07] bg-[#090a0b]/80 backdrop-blur-md py-3.5 mb-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setFilterFavorites(false)}
            className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
              !filterFavorites
                ? 'bg-white text-black font-medium'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Photos ({album.photos.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterFavorites(true)}
            className={`flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
              filterFavorites
                ? 'bg-rose-500 text-white font-medium shadow-md shadow-rose-500/30'
                : 'text-zinc-400 hover:text-rose-400'
            }`}
          >
            <Heart className={`h-3 w-3 ${favorites.length > 0 ? 'fill-current' : ''}`} />
            Favorites ({favorites.length})
          </button>
        </div>

        <span className="font-mono text-[11px] text-zinc-500 hidden sm:inline">
          Tap photo for fullscreen view
        </span>
      </div>

      {/* Dynamic Fluid Masonry Grid (Preserves natural portrait/landscape ratio without cropping) */}
      {displayedPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-16 text-center">
          <Heart className="h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-sm font-mono text-zinc-400">
            {filterFavorites
              ? 'ยังไม่มีรูปที่ถูกเลือกเป็น Favorite กดที่รูปหัวใจเพื่อบันทึกรูปที่ชอบได้เลยครับ'
              : 'ยังไม่มีรูปภาพในอัลบั้มนี้'}
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {displayedPhotos.map((photo, index) => (
            <ImageCard
              key={photo.id}
              photo={photo}
              index={index}
              isFavorite={favorites.includes(photo.id)}
              onToggleFavorite={handleToggleFavorite}
              onClick={() => {
                setActivePhotoIndex(index);
                setLightboxOpen(true);
              }}
            />
          ))}
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
