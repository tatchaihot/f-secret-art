'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Lock, Menu, X, Layers, Image as ImageIcon } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/15 bg-[#0b0a0d]/90 backdrop-blur-xl transition-all shadow-lg shadow-black/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Studio Branding with Official Logo */}
        <Link href="/" className="group flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-rose-500/20 border border-amber-500/30 group-hover:border-amber-400/60 transition-all p-1 shadow-md shadow-orange-500/15 shrink-0">
            <Image
              src="/logo.png"
              alt="F-Secret By Tatchai"
              width={34}
              height={34}
              className="object-contain filter drop-shadow group-hover:scale-105 transition-transform"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-serif tracking-wide text-sm sm:text-base font-semibold text-white uppercase whitespace-nowrap">
              F-Secret <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 font-sans font-light">AI Art</span>
            </span>
            <span className="text-[8px] sm:text-[9px] tracking-widest text-amber-300/80 uppercase font-mono -mt-0.5 whitespace-nowrap">
              By Tatchai · AI Art Studio
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 font-mono text-xs text-stone-300 uppercase tracking-wider">
          <Link href="/galleries" className="text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span>รวมแคตตาล็อก</span>
          </Link>
          <a href="/#styles" className="hover:text-amber-200 transition-colors">
            สไตล์ยอดนิยม
          </a>
          <a href="/#workflow" className="hover:text-amber-200 transition-colors">
            ขั้นตอนสั่งงาน
          </a>
          <a href="/#guide" className="hover:text-amber-200 transition-colors">
            วิธีส่งรูป
          </a>
          <a href="/#faq" className="hover:text-amber-200 transition-colors">
            คำถามที่พบบ่อย
          </a>
          <a href="/#contact" className="hover:text-amber-200 transition-colors">
            ติดต่อเรา
          </a>
        </div>

        {/* Direct Action Buttons & Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile Catalog Shortcut Button */}
          <Link
            href="/galleries"
            className="md:hidden flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-mono text-[11px] text-amber-300 hover:bg-amber-500/25 transition-all"
          >
            <Layers className="h-3 w-3 text-amber-400" />
            <span>แคตตาล็อก</span>
          </Link>

          {/* Quick Line Contact CTA for larger screens */}
          <a
            href="https://line.me/ti/p/~tatchaihot"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white px-3.5 py-1.5 text-xs font-mono tracking-wider font-semibold transition-all shadow-lg shadow-[#06C755]/20 hover:scale-105"
          >
            <MessageCircle className="h-3.5 w-3.5 fill-current" />
            <span>ทัก LINE สั่งงาน</span>
          </a>

          {/* Admin Portal Shortcut */}
          <Link
            href="/admin"
            className="flex items-center justify-center h-8 w-8 rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all"
            title="Admin Portal"
          >
            <Lock className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-amber-500/20 bg-[#0e0c10]/98 backdrop-blur-2xl px-6 py-6 space-y-4 animate-fade-in shadow-2xl">
          <div className="grid grid-cols-1 gap-3 font-mono text-sm">
            <Link
              href="/galleries"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold"
            >
              <Layers className="h-4 w-4 text-amber-400" />
              <span>ดูแคตตาล็อกทั้งหมด (All Galleries)</span>
            </Link>

            <a
              href="/#styles"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-amber-500/10 text-stone-200 hover:text-amber-200 transition-colors"
            >
              ✦ สไตล์ผลงานยอดนิยม
            </a>

            <a
              href="/#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-amber-500/10 text-stone-200 hover:text-amber-200 transition-colors"
            >
              ✦ 3 ขั้นตอนสั่งงาน
            </a>

            <a
              href="/#guide"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-amber-500/10 text-stone-200 hover:text-amber-200 transition-colors"
            >
              ✦ คำแนะนำวิธีเตรียมส่งรูป
            </a>

            <a
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-amber-500/10 text-stone-200 hover:text-amber-200 transition-colors"
            >
              ✦ คำถามที่พบบ่อย (FAQ)
            </a>

            <a
              href="/#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-amber-500/10 text-stone-200 hover:text-amber-200 transition-colors"
            >
              ✦ ติดต่อเรา (LINE QR Code)
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
