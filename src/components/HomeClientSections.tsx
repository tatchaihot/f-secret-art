'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, ChevronDown, MessageCircle, Sparkles, ArrowRight, ShieldCheck, Zap, Palette, Clock } from 'lucide-react';

export function LineContactCard() {
  const [copied, setCopied] = useState(false);
  const lineId = 'tatchaihot';

  const handleCopy = () => {
    navigator.clipboard.writeText(lineId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-900/90 to-black/90 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
      {/* Ambient background glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 filter blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/10 filter blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left Information */}
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
            {/* Direct Line Button */}
            <a
              href="https://line.me/ti/p/~tatchaihot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-[#06C755] hover:bg-[#05b34c] px-6 py-3 text-xs sm:text-sm font-mono font-semibold text-white transition-all shadow-lg shadow-[#06C755]/25 hover:scale-105"
            >
              <MessageCircle className="h-4 w-4 fill-white" />
              <span>แอด LINE: tatchaihot</span>
            </a>

            {/* Copy Line ID Button */}
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

        {/* Right QR Code Container */}
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

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'สั่งทำภาพ AI กับ F-Secret ต้องเตรียมข้อมูลอะไรบ้าง?',
      a: 'เพียงส่งรูปภาพตัวอย่างสไตล์ที่ชอบ (สามารถแคปรูปจากเว็บนี้ได้เลยครับ) หรือบอกไอเดียคร่าวๆ เช่น โทนสี อารมณ์ภาพ ท่าทาง หรือสินค้าที่ต้องการให้ปรากฏในภาพ หากมีข้อความหรือคำอธิบายเพิ่มเติมก็สามารถพิมพ์บอกทาง LINE ได้เลยครับ',
    },
    {
      q: 'ภาพที่ได้จะมีความละเอียดเท่าไหร่ สามารถนำไปพิมพ์ป้ายใหญ่ได้ไหม?',
      a: 'ทางเราใช้ระบบ Upscale & Enhance คุณภาพสูง สามารถส่งมอบไฟล์ความละเอียดระดับ 4K ไปจนถึง 8K (300 DPI) เหมาะสำหรับทั้งงานออนไลน์ และงานพิมพ์ป้ายบิลบอร์ด โบรชัวร์ หรือกล่องบรรจุภัณฑ์โดยที่ภาพไม่แตกครับ',
    },
    {
      q: 'ภาพที่ได้มีสิทธิ์นำไปใช้ในเชิงพาณิชย์ (Commercial Use) หรือไม่?',
      a: 'คุณจะได้รับสิทธิ์การนำภาพไปใช้งานเชิงพาณิชย์ 100% ครับ สามารถนำไปใช้ยิงแอดโฆษณา ทำคอนเทนต์ลงเพจ โพสต์ขายสินค้า หรือตีพิมพ์ในสื่อโฆษณาต่างๆ ได้อย่างสบายใจ',
    },
    {
      q: 'ระยะเวลาในการจัดทำภาพใช้เวลากี่วัน?',
      a: 'โดยทั่วไปจะใช้เวลาประมาณ 24 – 48 ชั่วโมงสำหรับส่งแบบร่างตัวอย่างให้ตรวจเช็กครับ หากเป็นงานด่วน สามารถแจ้งทาง LINE เพื่อขอคิวด่วนพิเศษได้ครับ',
    },
    {
      q: 'สามารถปรับแก้งานได้หรือไม่ มีเงื่อนไขอย่างไร?',
      a: 'เรามีรอบการส่งภาพตัวอย่างให้เลือกและสามารถปรับแก้ไขรายละเอียด เช่น แสง โทนสี องค์ประกอบ หรือรายละเอียดใบหน้า ได้ตามแพ็กเกจที่ตกลงกัน เพื่อให้ได้ผลลัพธ์ที่ตรงใจคุณที่สุดครับ',
    },
  ];

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {faqs.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            className={`rounded-xl border transition-all ${
              isOpen
                ? 'border-white/20 bg-zinc-900/60 shadow-lg'
                : 'border-white/[0.08] bg-zinc-950/40 hover:border-white/15'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between p-5 text-left transition-colors"
            >
              <span className="font-serif text-base sm:text-lg font-medium text-white pr-4">
                {item.q}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed border-t border-white/[0.06] mt-1 animate-fade-in">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
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
