'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090a0b] px-4 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white">
          <ShieldCheck className="h-6 w-6 text-zinc-300" />
        </div>

        <div className="text-center space-y-1 mb-8">
          <h1 className="font-serif text-2xl font-normal text-white">
            Admin Portal
          </h1>
          <p className="text-xs font-mono text-zinc-400">
            ระบบจัดการหลังบ้าน Lumen Atelier
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Admin Passcode
            </label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="กรอกรหัสผ่านหลังบ้าน"
                required
                className="w-full rounded-lg border border-white/10 bg-zinc-900/90 px-4 py-2.5 pr-11 text-sm text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPasscode((prev) => !prev)}
                aria-label={showPasscode ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-white transition-colors"
              >
                {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-400 font-mono">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-2.5 text-xs font-mono uppercase tracking-widest text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-white/[0.08] text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> กลับสู่หน้าแรก (Go to Website)
          </Link>
        </div>
      </div>
    </div>
  );
}
