'use client';

import { useState, useEffect } from 'react';
import { Lock, ArrowUpToLine, ArrowDownToLine, X } from 'lucide-react';
import { Album } from '@/lib/db';

export interface AlbumFormValues {
  title: string;
  description: string;
  clientName: string;
  eventDate: string;
  isPrivate: boolean;
  passcode: string;
  placeAtTop: boolean;
}

interface AlbumFormModalProps {
  isOpen: boolean;
  editingAlbum: Album | null;
  onClose: () => void;
  onSubmit: (values: AlbumFormValues) => Promise<void>;
}

export default function AlbumFormModal({
  isOpen,
  editingAlbum,
  onClose,
  onSubmit,
}: AlbumFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [placeAtTop, setPlaceAtTop] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingAlbum) {
      setTitle(editingAlbum.title || '');
      setDescription(editingAlbum.description || '');
      setClientName(editingAlbum.clientName || '');
      setEventDate(editingAlbum.eventDate || '');
      setIsPrivate(editingAlbum.isPrivate === 1);
      setPasscode(editingAlbum.passcode || '');
      setPlaceAtTop(false);
    } else {
      setTitle('');
      setDescription('');
      setClientName('');
      setEventDate('');
      setIsPrivate(false);
      setPasscode('');
      setPlaceAtTop(true);
    }
  }, [isOpen, editingAlbum]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description,
        clientName,
        eventDate,
        isPrivate,
        passcode,
        placeAtTop,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl my-8 border border-amber-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="font-serif text-xl font-medium text-white">
              {editingAlbum ? 'แก้ไขข้อมูลอัลบั้ม / สไตล์ภาพ' : 'สร้างอัลบั้ม / สไตล์ภาพใหม่'}
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-1 font-light">
              {editingAlbum
                ? 'ปรับแก้ชื่อ คำอธิบาย ป้ายกำกับ หรือรหัสผ่านอัลบั้ม (ลากจัดลำดับได้ที่หน้ารวมอัลบั้ม)'
                : 'กรอกรายละเอียดสไตล์ภาพ สามารถกด Enter ขึ้นบรรทัดใหม่ในคำอธิบายได้ค่ะ'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
              ชื่ออัลบั้ม / สไตล์ภาพ *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น AI ใหม่! 05, ชุดราตรีหรู, คอสเพลย์"
              required
              className="w-full rounded-lg border border-white/15 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
              คำอธิบายรายละเอียดสไตล์ภาพ (รองรับการขึ้นบรรทัดใหม่)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="อธิบายจุดเด่น วิธีสั่งทำ หรือข้อแนะนำสำหรับสไตล์นี้ (ปล่อยว่างได้หากไม่ต้องการแสดงคำอธิบาย)"
              className="w-full rounded-lg border border-white/15 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-400/50 focus:outline-none leading-relaxed"
            />
          </div>

          {!editingAlbum && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                ตำแหน่งจัดวางในแคตตาล็อก
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPlaceAtTop(true)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-mono transition-all ${
                    placeAtTop
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-semibold'
                      : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <ArrowUpToLine className="h-3.5 w-3.5" />
                  <span>วางบนสุด (#1 แนะนำ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlaceAtTop(false)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-mono transition-all ${
                    !placeAtTop
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-semibold'
                      : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  <span>วางต่อท้ายสุด</span>
                </button>
              </div>
            </div>
          )}

          {/* Optional Metadata Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                ป้ายกำกับเสริม (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="เช่น Best Seller, VIP, ชุดไทย"
                className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                ป้ายวันที่/รุ่น (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="เช่น อัปเดต พ.ย. 2026"
                className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Private Album Passcode Gate */}
          <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3.5 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2 text-xs font-mono text-zinc-200">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>ตั้งเป็นอัลบั้มส่วนตัว (ต้องใส่รหัสผ่านก่อนเข้าชม)</span>
              </span>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 accent-amber-500 rounded"
              />
            </label>

            {isPrivate && (
              <div>
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="กำหนดรหัสผ่านสำหรับส่งให้ลูกค้าเปิดอัลบั้มนี้"
                  required={isPrivate}
                  className="w-full rounded-lg border border-amber-500/30 bg-zinc-900 px-3 py-2 text-xs font-mono text-amber-200 placeholder-zinc-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-white px-5 py-2 text-xs font-mono uppercase tracking-wider text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : editingAlbum ? 'บันทึกการแก้ไข' : 'สร้างอัลบั้ม'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
