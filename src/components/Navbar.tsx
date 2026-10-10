'use client';

import Link from 'next/link';
import { Camera, Lock, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-black/60 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Studio Branding */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-white/30 transition-colors">
            <Camera className="h-4 w-4 text-zinc-300 group-hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif tracking-wider text-sm sm:text-base font-semibold text-zinc-100 uppercase">
              Lumen Atelier
            </span>
            <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono -mt-0.5">
              Client Archive
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="text-xs sm:text-sm text-zinc-400 hover:text-white px-3 py-1.5 transition-colors font-mono tracking-wide uppercase"
          >
            Galleries
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/10 hover:border-white/25 px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-all font-mono tracking-wider uppercase"
          >
            <Lock className="h-3 w-3 text-zinc-400" />
            <span className="hidden sm:inline">Admin</span> Portal
          </Link>
        </div>
      </div>
    </header>
  );
}
