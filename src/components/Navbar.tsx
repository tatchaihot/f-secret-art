'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, MessageCircle, Lock, Menu, X, Layers, Image as ImageIcon } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-black/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Studio Branding */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-white/15 group-hover:border-white/30 transition-all">
            <Sparkles className="h-4 w-4 text-purple-300 group-hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif tracking-wide text-base font-semibold text-white uppercase">
              F-Secret <span className="text-purple-400 font-sans font-light">AI Art</span>
            </span>
            <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono -mt-0.5">
              Bespoke AI Visuals
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 font-mono text-xs text-zinc-300 uppercase tracking-wider">
          <Link href="/galleries" className="hover:text-purple-300 transition-colors flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            <span>รวมแคตตาล็อก</span>
          </Link>
          <a href="/#styles" className="hover:text-white transition-colors">
            สไตล์ยอดนิยม
          </a>
          <a href="/#workflow" className="hover:text-white transition-colors">
            ขั้นตอนสั่งงาน
          </a>
          <a href="/#guide" className="hover:text-white transition-colors">
            วิธีส่งรูป
          </a>
          <a href="/#faq" className="hover:text-white transition-colors">
            คำถามที่พบบ่อย
          </a>
          <a href="/#contact" className="hover:text-white transition-colors">
            ติดต่อเรา
          </a>
        </div>

        {/* Direct Action Buttons & Mobile Hamburger */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Quick links on mobile: Gallery & Contact */}
          <Link
            href="/galleries"
            className="md:hidden text-xs font-mono text-zinc-300 hover:text-white px-2 py-1 transition-colors"
          >
            Gallery
          </Link>
          <a
            href="https://line.me/ti/p/~tatchaihot"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden text-xs font-mono text-zinc-300 hover:text-white px-2 py-1 transition-colors"
          >
            ติดต่อ
          </a>

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
        <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-2xl px-6 py-6 space-y-4 animate-fade-in shadow-2xl">
          <div className="grid grid-cols-1 gap-3 font-mono text-sm">
            <Link
              href="/galleries"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold"
            >
              <Layers className="h-4 w-4" />
              <span>ดูแคตตาล็อกทั้งหมด (All Galleries)</span>
            </Link>

            <a
              href="/#styles"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white transition-colors"
            >
              ✦ สไตล์ผลงานยอดนิยม
            </a>

            <a
              href="/#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white transition-colors"
            >
              ✦ 3 ขั้นตอนสั่งงาน
            </a>

            <a
              href="/#guide"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white transition-colors"
            >
              ✦ คำแนะนำวิธีเตรียมส่งรูป
            </a>

            <a
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white transition-colors"
            >
              ✦ คำถามที่พบบ่อย (FAQ)
            </a>

            <a
              href="/#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-white/5 text-zinc-200 hover:text-white transition-colors"
            >
              ✦ ติดต่อเรา (LINE QR Code)
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
