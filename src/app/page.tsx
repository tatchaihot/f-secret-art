import Link from 'next/link';
import Image from 'next/image';
import { getAllAlbums, getActiveAnnouncements, getAllFaqs, seedSampleData } from '@/lib/db';
import Navbar from '@/components/Navbar';
import { HeroActions, LineContactCard, FaqSection, AnnouncementNewsSection, PhotoGuideSection } from '@/components/HomeClientSections';
import { Sparkles, ArrowRight, Images, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  try {
    await seedSampleData();
  } catch (e) {
    // Ignore seed check note
  }

  const allAlbums = await getAllAlbums();
  const featuredAlbums = allAlbums.slice(0, 3);
  const announcements = await getActiveAnnouncements();
  const faqs = await getAllFaqs();

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0a0d] text-stone-100 selection:bg-amber-500 selection:text-stone-950">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-amber-500/15 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] sm:w-[650px] rounded-full bg-gradient-to-tr from-amber-500/25 via-orange-500/20 to-rose-500/15 filter blur-[140px] pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/10 px-3.5 py-1 font-mono text-xs text-amber-300 shadow-sm shadow-amber-500/10">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>F-Secret AI Art · สตูดิโอสร้างสรรค์ภาพ AI โดย Tatchai</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.15]">
                บริการรับสร้างภาพ AI สำหรับ <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 drop-shadow-sm">โปรไฟล์ บุคคล และแบรนด์</span>
              </h1>

              <p className="text-base sm:text-lg text-stone-300 leading-relaxed font-light max-w-2xl">
                สร้างสรรค์ภาพถ่ายโปรไฟล์โมเดลเสมือนจริง สินค้า โฆษณา และงานศิลป์สุดประณีต ตรงตามบรีฟของคุณ เลือกดูสไตล์ภาพที่ต้องการด้านล่าง แล้วทัก LINE เพื่อเริ่มงานได้ทันทีค่ะ
              </p>

              <HeroActions />
            </div>
          </div>
        </section>

        {/* 1. SEPARATE ANNOUNCEMENTS / NEWS (ข่าวสาร & ข้อความประกาศอิสระ) */}
        {announcements.length > 0 && (
          <section className="border-b border-amber-500/15 bg-[#0e0c10]/40 py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-8">
              <AnnouncementNewsSection announcements={announcements} />
            </div>
          </section>
        )}

        {/* 2. FEATURED 3 STYLES SECTION */}
        <section id="styles" className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-amber-500/15 pb-6 mb-10 gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
                Featured Styles
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal text-white mt-1">
                สไตล์ภาพตัวอย่างยอดนิยม
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-2 font-light max-w-xl">
                ตัวอย่างหมวดหมู่ที่ได้รับความนิยม แตะเข้าไปดูรูปขยายใหญ่ และกดหัวใจบันทึกแบบที่ชอบส่งให้เราได้เลยนะคะ
              </p>
            </div>

            <Link
              href="/galleries"
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/15 hover:bg-amber-500/25 px-4 py-2 font-mono text-xs text-amber-300 transition-all self-start md:self-end shadow-sm shadow-amber-500/10"
            >
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>ดูแคตตาล็อกทั้งหมด ({allAlbums.length} สไตล์)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredAlbums.map((album) => {
              const cover = album.coverImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

              return (
                <Link
                  key={album.id}
                  href={`/album/${album.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl glass-panel transition-all duration-300 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-orange-500/15"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-950">
                    <Image
                      src={cover}
                      alt={album.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a0d] via-black/30 to-transparent" />

                    <div className="absolute top-3.5 right-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0b0a0d]/80 backdrop-blur-md px-3 py-1 text-xs font-mono text-amber-200 border border-amber-500/30 shadow-md">
                        <Images className="h-3.5 w-3.5 text-amber-400" />
                        {album.photoCount || 0} ตัวอย่าง
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                    <div>
                      <h3 className="font-serif text-xl font-medium text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {album.title}
                      </h3>
                      {album.description && (
                        <p className="mt-2 text-xs sm:text-sm text-stone-400 line-clamp-2 leading-relaxed font-light">
                          {album.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-amber-500/15 text-xs font-mono text-stone-300 group-hover:text-amber-200 transition-colors">
                      <span className="text-amber-400 font-semibold group-hover:underline">
                        เข้าชมแกลเลอรีนี้
                      </span>
                      <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/galleries"
              className="btn-gold inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-xs sm:text-sm font-mono uppercase tracking-wider font-semibold hover:scale-105 transition-all shadow-xl shadow-amber-500/20"
            >
              <Images className="h-4 w-4" />
              <span>เข้าดูรวมแคตตาล็อกทั้งหมด ({allAlbums.length} อัลบั้ม)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* 3. THREE STEPS HOW TO ORDER SECTION */}
        <section id="workflow" className="border-t border-amber-500/15 bg-[#0e0c10]/60 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
                Simple & Professional Process
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal text-white">
                3 ขั้นตอนการสั่งทำภาพง่ายๆ
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 font-light">
                สะดวก รวดเร็ว พร้อมให้คำปรึกษาตลอดการทำงานค่ะ
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="relative rounded-2xl bg-gradient-to-b from-[#181317] to-[#120f13] border border-amber-500/30 p-8 space-y-4 shadow-xl hover:border-amber-500/50 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-lg font-bold shadow-sm shadow-amber-500/20">
                  01
                </div>
                <h3 className="font-serif text-lg font-medium text-white">
                  เลือกสไตล์หรือส่งตัวอย่าง
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 font-light leading-relaxed">
                  เลือกดูสไตล์จากเว็บนี้ หรือเตรียมรูปถ่ายของคุณตามคำแนะนำด้านล่าง พร้อมบอกรายละเอียดที่ต้องการ
                </p>
              </div>

              <div className="relative rounded-2xl bg-gradient-to-b from-[#121815] to-[#0e1411] border border-emerald-500/30 p-8 space-y-4 shadow-xl hover:border-emerald-500/50 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-lg font-bold shadow-sm shadow-emerald-500/20">
                  02
                </div>
                <h3 className="font-serif text-lg font-medium text-white">
                  ทัก LINE คุยรายละเอียด
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 font-light leading-relaxed">
                  แอด LINE: <span className="text-emerald-400 font-mono font-semibold">tatchaihot</span> ส่งแบบมาประเมินราคาและระยะเวลาดำเนินงานได้ทันทีค่ะ
                </p>
              </div>

              <div className="relative rounded-2xl bg-gradient-to-b from-[#1a1316] to-[#140e11] border border-rose-500/30 p-8 space-y-4 shadow-xl hover:border-rose-500/50 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-lg font-bold shadow-sm shadow-rose-500/20">
                  03
                </div>
                <h3 className="font-serif text-lg font-medium text-white">
                  ตรวจรับงาน
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 font-light leading-relaxed">
                  รอรับภาพตัวอย่าง ตรวจเช็กและปรับแต่งรายละเอียด จากนั้นรับไฟล์พร้อมสิทธิ์ใช้งานเชิงพาณิชย์
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PHOTO PREPARATION GUIDE (วางไว้ก่อนหน้าคำถามที่พบบ่อยตามคำขอ) */}
        <section id="guide" className="border-t border-amber-500/15 py-20 bg-[#09080a]/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <PhotoGuideSection />
          </div>
        </section>

        {/* 5. FAQ SECTION (DYNAMIC FROM DB, EDITABLE IN ADMIN) */}
        <section id="faq" className="border-t border-amber-500/15 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
              <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
                Frequently Asked Questions
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-normal text-white">
                คำถามที่พบบ่อย (FAQ)
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 font-light">
                ไขข้อสงสัยก่อนตัดสินใจสั่งทำภาพ AI กับ F-Secret ค่ะ
              </p>
            </div>

            <FaqSection faqs={faqs} />
          </div>
        </section>

        {/* 6. CONTACT SECTION WITH QR CODE */}
        <section id="contact" className="border-t border-amber-500/15 py-20 bg-[#0c0a0e]/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <LineContactCard />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-amber-500/15 bg-[#080709] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs text-stone-400">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="F-Secret Logo" width={26} height={26} className="object-contain" />
              <span className="font-serif text-sm font-semibold text-white tracking-wider">
                F-SECRET BY TATCHAI
              </span>
            </div>
            <span className="hidden sm:inline text-stone-600">|</span>
            <span>LINE ID: <span className="text-emerald-400 font-bold">tatchaihot</span></span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/galleries" className="hover:text-amber-300 transition-colors">รวมแคตตาล็อก</Link>
            <a href="#workflow" className="hover:text-amber-200 transition-colors">ขั้นตอนสั่งงาน</a>
            <a href="#guide" className="hover:text-amber-200 transition-colors">วิธีส่งรูป</a>
            <a href="#faq" className="hover:text-amber-200 transition-colors">FAQ</a>
            <a href="https://line.me/ti/p/~tatchaihot" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              แอดไลน์ทันที
            </a>
            <Link href="/admin" className="hover:text-stone-200 transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
