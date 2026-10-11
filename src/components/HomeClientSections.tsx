'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, ChevronDown, MessageCircle, Sparkles, ArrowRight, X, ZoomIn, Megaphone, Info, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Announcement, FaqItem } from '@/lib/db';

// 1. Text & Banner Announcements Section (แยกประกาศข่าวสารอิสระ)
export function AnnouncementNewsSection({ announcements }: { announcements: Announcement[] }) {
  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Megaphone className="h-3.5 w-3.5 animate-pulse" />
        </div>
        <h3 className="font-serif text-base sm:text-lg font-normal text-white">
          ข่าวสารและประกาศจากสตูดิโอ
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {announcements.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-xl glass-panel p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-lg shadow-black/50"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                  Announcement
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {item.createdAt?.split('T')[0]}
                </span>
              </div>

              <h4 className="font-serif text-base sm:text-lg font-medium text-white">
                {item.title}
              </h4>

              {item.content && (
                <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>
              )}

              {/* Optional Announcement Banner Image */}
              {item.imageUrl && (
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-stone-950 mt-3 border border-amber-500/20">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            {item.linkUrl && (
              <div className="pt-4 mt-2 border-t border-amber-500/15">
                <a
                  href={item.linkUrl}
                  target={item.linkUrl.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-amber-300 hover:text-white transition-colors"
                >
                  <span>อ่านเพิ่มเติม / ติดต่อทาง LINE</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Photo Preparation Guide Section (วิธีส่งรูปถ่ายก่อนหน้า FAQ)
export function PhotoGuideSection() {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
          Photo Preparation Guide
        </span>
        <h2 className="font-serif text-2xl sm:text-4xl font-normal text-white">
          คำแนะนำ: วิธีเตรียมรูปถ่ายเพื่อสร้างภาพ AI
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 font-light leading-relaxed">
          เพื่อให้ภาพ AI ที่สร้างออกมามีความเหมือนใบหน้าของคุณและดูเป็นธรรมชาติที่สุด สามารถดูคำแนะนำในการเตรียมรูปถ่าย 4–6 รูปด้านล่างนี้ได้เลยนะคะ
        </p>
      </div>

      {/* Guide Infographic Card with Zoom feature */}
      <div className="max-w-4xl mx-auto rounded-2xl glass-panel p-4 sm:p-8 border border-white/15 shadow-2xl space-y-6">
        <div
          onClick={() => setIsZoomOpen(true)}
          className="group relative w-full aspect-[4/5] sm:aspect-[16/10] overflow-hidden rounded-xl bg-zinc-950 border border-white/10 cursor-pointer shadow-inner"
        >
          <Image
            src="/guides/lora-guide.jpg"
            alt="ส่งรูปแบบไหน เพื่อเทรน LoRA? คำแนะนำวิธีเตรียมรูปภาพ AI"
            fill
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.02]"
            priority
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

          {/* Zoom Badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-3.5 py-1.5 text-xs font-mono text-white border border-white/20 shadow-lg group-hover:scale-105 transition-transform">
            <ZoomIn className="h-4 w-4 text-amber-400" />
            <span>แตะเพื่อซูมดูรูปเต็มจอ (ขยายอ่านง่าย)</span>
          </div>
        </div>

        {/* Quick Bullet Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-2">
            <h4 className="font-serif text-sm font-medium text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>สิ่งที่ควรส่ง (4–6 รูปก็เพียงพอ)</span>
            </h4>
            <ul className="text-xs text-zinc-300 space-y-1 font-light list-disc list-inside">
              <li>หน้าตรง, หันซ้าย, หันขวา</li>
              <li>ภาพครึ่งตัว และเต็มตัว</li>
              <li>ยิ้มธรรมชาติ แสงสว่างสม่ำเสมอ ชัดเจน</li>
              <li>เป็นคนเดียวกันและเป็นรูปเดี่ยว</li>
            </ul>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4 space-y-2">
            <h4 className="font-serif text-sm font-medium text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>สิ่งที่ควรหลีกเลี่ยง</span>
            </h4>
            <ul className="text-xs text-zinc-300 space-y-1 font-light list-disc list-inside">
              <li>รูปเบลอ หรือมืด ย้อนแสง</li>
              <li>รูปที่มีคนอื่นอยู่ในภาพ</li>
              <li>มีสิ่งของหรือมือมาบังใบหน้า</li>
              <li>รูปที่แต่งฟิลเตอร์จนผิดสัดส่วนจริง</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox for Infographic */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-6 animate-fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="ปิด (Close)"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative max-h-[92vh] max-w-[95vw] overflow-auto rounded-xl">
            <img
              src="/guides/lora-guide.jpg"
              alt="คำแนะนำการเตรียมรูปภาพ"
              className="max-h-[90vh] w-auto object-contain rounded-lg shadow-2xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// 3. Dynamic FAQs Section
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
                ? 'border-amber-500/45 bg-[#171217] shadow-lg shadow-amber-500/10'
                : 'border-amber-500/15 bg-[#120f14]/60 hover:border-amber-500/30'
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
                className={`h-4 w-4 text-stone-400 shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-300 font-light leading-relaxed border-t border-amber-500/15 mt-1 animate-fade-in">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// 4. Contact & QR Code Section
export function LineContactCard() {
  const [copied, setCopied] = useState(false);
  const lineId = 'tatchaihot';

  const handleCopy = () => {
    navigator.clipboard.writeText(lineId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-10 shadow-2xl border border-amber-500/25">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/15 filter blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-amber-500/20 filter blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-300 shadow-sm shadow-emerald-500/15">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            พร้อมรับงานตลอด 24 ชม. · ตอบกลับรวดเร็ว
          </div>

          <h3 className="font-serif text-2xl sm:text-4xl font-normal text-white">
            ทักไลน์สอบถาม / สั่งทำภาพ AI
          </h3>

          <p className="text-sm sm:text-base text-stone-300 font-light leading-relaxed max-w-xl">
            แคปภาพสไตล์ที่ถูกใจจากเว็บนี้ แล้วส่งมาทางไลน์เพื่อประเมินราคาหรือปรึกษาไอเดียได้ทันทีเลยค่ะ ให้คำแนะนำฟรี ไม่มีค่าใช้จ่ายเบื้องต้น
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
              className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-stone-900/60 hover:bg-amber-500/10 hover:border-amber-500/40 px-4 py-3 text-xs font-mono text-stone-300 hover:text-white transition-all"
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
          <div className="relative rounded-2xl p-3 bg-stone-900/80 border border-amber-500/30 backdrop-blur-xl shadow-2xl hover:border-amber-400/50 transition-colors">
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
              <p className="text-[11px] font-mono tracking-widest uppercase text-stone-400">
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

// 5. Hero Actions
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
        className="btn-gold flex items-center gap-2 rounded-full px-6 py-3 text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold hover:scale-105 transition-all shadow-lg shadow-amber-500/20"
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
        className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-stone-900/70 hover:bg-amber-500/10 hover:border-amber-500/45 px-4 py-3 text-xs font-mono text-stone-300 hover:text-white transition-all shadow-sm"
        title="คัดลอก LINE ID: tatchaihot"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Copied tatchaihot!</span>
          </>
        ) : (
          <>
            <span className="text-stone-500">ID:</span>
            <span>tatchaihot</span>
            <Copy className="h-3.5 w-3.5 ml-1 text-stone-400" />
          </>
        )}
      </button>
    </div>
  );
}
