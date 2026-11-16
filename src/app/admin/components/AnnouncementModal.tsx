'use client';

import { useState, useEffect, useRef } from 'react';
import { UploadCloud, Trash2, MessageCircle, X, Eye } from 'lucide-react';
import { Announcement } from '@/lib/db';

interface AnnouncementModalProps {
  isOpen: boolean;
  editingAnnouncement: Announcement | null;
  onClose: () => void;
  onSaved: (announcement: Announcement, isEdit: boolean) => void;
  onError: (message: string) => void;
}

export default function AnnouncementModal({
  isOpen,
  editingAnnouncement,
  onClose,
  onSaved,
  onError,
}: AnnouncementModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingAnnouncement) {
      setTitle(editingAnnouncement.title || '');
      setContent(editingAnnouncement.content || '');
      setLinkUrl(editingAnnouncement.linkUrl || '');
      setIsActive(editingAnnouncement.isActive !== 0);
      setSelectedFile(null);
      setPreviewUrl(editingAnnouncement.imageUrl || null);
      setRemoveImage(false);
    } else {
      setTitle('');
      setContent('');
      setLinkUrl('');
      setIsActive(true);
      setSelectedFile(null);
      setPreviewUrl(null);
      setRemoveImage(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [isOpen, editingAnnouncement]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasTitle = title.trim().length > 0;
    const hasContent = content.trim().length > 0;
    const hasImage = Boolean(selectedFile || (!removeImage && previewUrl));

    if (!hasTitle && !hasContent && !hasImage) {
      onError('กรุณากรอกหัวข้อ เนื้อหา หรือแนบรูปภาพอย่างน้อย 1 อย่างนะคะ');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (editingAnnouncement) {
        formData.append('id', editingAnnouncement.id);
        formData.append('sortOrder', String(editingAnnouncement.sortOrder ?? 0));
      }
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('linkUrl', linkUrl.trim());
      formData.append('isActive', String(isActive));
      if (removeImage) {
        formData.append('removeImage', 'true');
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/announcements', {
        method: editingAnnouncement ? 'PUT' : 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.announcement) {
        onSaved(data.announcement, Boolean(editingAnnouncement));
      } else {
        onError(data.error || 'บันทึกประกาศไม่สำเร็จ');
      }
    } catch {
      onError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
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
        className="w-full max-w-xl rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl my-8 border border-amber-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="font-serif text-xl font-medium text-white">
              {editingAnnouncement
                ? 'แก้ไขข่าวสาร & ประกาศจากสตูดิโอ'
                : 'เพิ่มข่าวสาร / ประกาศจากสตูดิโอ'}
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-1 font-light">
              ใส่ได้ทั้งตัวหนังสืออย่างเดียว รูปภาพอย่างเดียว หรือใส่คู่กันทั้งภาพและข้อความเลยค่ะ
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
              หัวข้อประกาศ (ไม่บังคับหากลงเฉพาะภาพหรือเนื้อหา)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น เวลาทำงาน, โปรโมชั่นเดือนนี้, อัปเดตโมเดลใหม่"
              className="w-full rounded-lg border border-white/15 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
              เนื้อหาประกาศ / ข้อความรายละเอียด (รองรับการขึ้นบรรทัดใหม่)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="พิมพ์ข้อความแจ้งข่าวสาร เวลาทำการ ราคาโปรโมชั่น หรือรายละเอียดเพิ่มเติม..."
              rows={4}
              className="w-full rounded-lg border border-white/15 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-400/50 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Image Upload & Preview Zone */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300">
              รูปภาพประกอบประกาศ / แบนเนอร์ (ไม่บังคับ)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files)}
            />

            {previewUrl ? (
              <div className="rounded-xl border border-amber-500/30 bg-zinc-950/90 p-3 space-y-3">
                <div className="relative max-h-56 overflow-hidden rounded-lg bg-black/50 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="ตัวอย่างภาพประกาศ"
                    className="max-h-56 w-auto object-contain rounded"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-mono text-white transition-colors"
                  >
                    <UploadCloud className="h-3.5 w-3.5 text-amber-300" />
                    <span>เปลี่ยนรูปภาพใหม่</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-mono text-rose-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ลบรูปภาพออก (ใช้เฉพาะตัวหนังสือ)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileChange(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 bg-zinc-950/60 p-6 text-center hover:border-amber-500/40 hover:bg-zinc-900/60 transition-all cursor-pointer"
              >
                <UploadCloud className="h-6 w-6 text-amber-300 mb-2" />
                <p className="text-xs font-mono text-zinc-200">
                  คลิกเลือกรูปภาพ หรือลากไฟล์มาวางตรงนี้
                </p>
                <p className="text-[11px] font-mono text-zinc-500 mt-1">
                  แนะนำแนวนอน 16:9 หรือโปสเตอร์ที่อ่านชัดบนมือถือ
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-300">
                ลิงก์ปุ่มกดเพิ่มเติม (ไม่บังคับ)
              </label>
              <button
                type="button"
                onClick={() => setLinkUrl('https://line.me/ti/p/~tatchaihot')}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300"
              >
                <MessageCircle className="h-3 w-3" />
                <span>ใส่ลิงก์ LINE ร้านอัตโนมัติ</span>
              </button>
            </div>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://line.me/ti/p/~tatchaihot"
              className="w-full rounded-lg border border-white/15 bg-zinc-900/90 px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/60 p-3.5 cursor-pointer">
            <span className="flex items-center gap-2 text-xs font-mono text-zinc-200">
              <Eye className="h-3.5 w-3.5 text-emerald-400" />
              <span>แสดงประกาศนี้บนหน้าแรกของเว็บทันที</span>
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-emerald-500 rounded"
            />
          </label>

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
              className="rounded-lg bg-white px-5 py-2 text-xs font-mono uppercase tracking-wider text-black font-semibold hover:bg-zinc-200 disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : editingAnnouncement ? 'บันทึกการแก้ไข' : 'บันทึกประกาศ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
