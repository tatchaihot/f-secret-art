'use client';

import Link from 'next/link';
import { Sparkles, MessageCircle, Lock } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-black/75 backdrop-blur-xl transition-all">
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

        {/* Navigation Actions */}
        <div className="hidden md:flex items-center gap-6 font-mono text-xs text-zinc-300 uppercase tracking-wider">
          <a href="/#styles" className="hover:text-white transition-colors">
            สไตล์ผลงาน
          </a>
          <a href="/#workflow" className="hover:text-white transition-colors">
            ขั้นตอนสั่งงาน
          </a>
          <a href="/#faq" className="hover:text-white transition-colors">
            คำถามที่พบบ่อย
          </a>
          <a href="/#contact" className="hover:text-white transition-colors">
            ติดต่อเรา
          </a>
        </div>

        {/* Direct Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Line Contact CTA */}
          <a
            href="https://line.me/ti/p/~tatchaihot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white px-3.5 py-1.5 text-xs font-mono tracking-wider font-semibold transition-all shadow-lg shadow-[#06C755]/20 hover:scale-105"
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
        </div>
      </div>
    </header>
  );
}
