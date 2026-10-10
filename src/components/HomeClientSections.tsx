'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, ChevronDown, MessageCircle, Sparkles, ArrowRight, X, ZoomIn, Eye, Megaphone } from 'lucide-react';
import { Announcement, FaqItem } from '@/lib/db';

export function AnnouncementBannerSection({ announcements }: { announcements: Announcement[] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Megaphone className="h-4 w-4" />
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-normal text-white">
            ประกาศ & คำแนะนำสำคัญ
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          แตะที่รูปเพื่อดูขนาดเต็ม
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedImage(item.imageUrl)}
            className="group relative flex flex-col overflow-hidden rounded-2xl glass-panel border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer shadow-xl"
          >
            {/* 16:9 Horizontal Aspect Ratio for Optimal Mobile View */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-950">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain sm:object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-[11px] font-mono text-white border border-white/20">
                <ZoomIn className="h-3.5 w-3.5 text-purple-400" />
                <span>แตะเพื่อซูมดูรูปเต็ม</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-950/70 border-t border-white/[0.06]">
              <h4 className="font-serif text-sm sm:text-base font-medium text-white group-hover:text-purple-200 transition-colors line-clamp-2">
                {item.title}
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Zoom Modal for Infographics */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-6 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative max-h-[92vh] max-w-[95vw] overflow-auto rounded-xl">
            <img
              src={selectedImage}
              alt="Announcement full preview"
              className="max-h-[90vh] w-auto object-contain rounded-lg shadow-2xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function FaqSection({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {faqs.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={item.id || index}
            className={`rounded-xl border transition-all ${
              isOpen
                ? 'border-purple-500/40 bg-zinc-900/60 shadow-lg shadow-purple-500/5'
                : 'border-white/[0.08] bg-zinc-950/40 hover:border-white/15'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between p-5 text-left transition-colors"
            >
              <span className="font-serif text-base sm:text-lg font-medium text-white pr-4">
                {item.question}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-purple-400' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-300 font-light leading-relaxed border-t border-white/[0.06] mt-1 animate-fade-in">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function LineContactCard() {
  const [copied, setCopied] = useState(false);
  const lineId = 'tatchaihot';

  const handleCopy = () => {
    navigator.clipboard.writeText(lineId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-10 shadow-2xl">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 filter blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/10 filter blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            พร้อมรับงานตลอด 24 ชม. · ตอบกลับรวดเร็ว
          </div>

          <h3 className="font-serif text-2xl sm:text-4xl font-normal text-white">
            ทักไลน์สอบถาม / สั่งทำภาพ AI
          </h3>

          <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed max-w-xl">
            แคปภาพสไตล์ที่ถูกใจจากเว็บนี้ แล้วส่งมาทางไลน์เพื่อประเมินราคาหรือปรึกษาไอเดียได้ทันทีครับ ให้คำแนะนำฟรี ไม่มีค่าใช้จ่ายเบื้องต้น
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <a
              href="https://line.me/ti/p/~tatchaihot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-[#06C755] hover:bg-[#05b34c] px-6 py-3 text-xs sm:text-sm font-mono font-semibold text-white transition-all shadow-lg shadow-[#06C755]/25 hover:scale-105"
            >
              <MessageCircle className="h-4 w-4 fill-white" />
              <span>แอด LINE: tatchaihot</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-3 text-xs font-mono text-zinc-300 hover:text-white transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">คัดลอก ID แล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>คัดลอก LINE ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative rounded-2xl p-3 bg-white/5 border border-white/20 backdrop-blur-xl shadow-2xl hover:border-emerald-500/40 transition-colors">
            <div className="relative h-48 w-48 sm:h-52 sm:w-52 overflow-hidden rounded-xl bg-white">
              <Image
                src="/line-qr.jpg"
                alt="LINE QR Code - F-Secret AI Art"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
            <div className="mt-2 text-center">
              <p className="text-[11px] font-mono tracking-widest uppercase text-zinc-400">
                Scan to Add LINE
              </p>
              <p className="text-xs font-mono text-emerald-400 font-semibold">
                ID: tatchaihot
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroActions() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('tatchaihot');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 pt-4">
      <a
        href="#styles"
        className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-mono uppercase tracking-wider text-black font-semibold hover:bg-zinc-200 transition-all shadow-lg hover:scale-105"
      >
        <span>เลือกชมสไตล์ผลงาน</span>
        <ArrowRight className="h-4 w-4" />
      </a>

      <a
        href="https://line.me/ti/p/~tatchaihot"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-full bg-[#06C755] hover:bg-[#05b34c] px-6 py-3 text-xs sm:text-sm font-mono tracking-wider text-white font-semibold transition-all shadow-lg shadow-[#06C755]/25 hover:scale-105"
      >
        <MessageCircle className="h-4 w-4 fill-white" />
        <span>ทักไลน์สอบถาม (LINE)</span>
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-xs font-mono text-zinc-300 hover:text-white transition-all"
        title="คัดลอก LINE ID: tatchaihot"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Copied tatchaihot!</span>
          </>
        ) : (
          <>
            <span className="text-zinc-500">ID:</span>
            <span>tatchaihot</span>
            <Copy className="h-3.5 w-3.5 ml-1 text-zinc-400" />
          </>
        )}
      </button>
    </div>
  );
}
