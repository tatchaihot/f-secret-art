'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FaqItem } from '@/lib/db';

interface FaqModalProps {
  isOpen: boolean;
  editingFaq: FaqItem | null;
  defaultSortOrder: number;
  onClose: () => void;
  onSave: (values: { question: string; answer: string; sortOrder: number }) => Promise<void>;
}

export default function FaqModal({
  isOpen,
  editingFaq,
  defaultSortOrder,
  onClose,
  onSave,
}: FaqModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingFaq) {
      setQuestion(editingFaq.question || '');
      setAnswer(editingFaq.answer || '');
    } else {
      setQuestion('');
      setAnswer('');
    }
  }, [isOpen, editingFaq]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSave({
        question: question.trim(),
        answer: answer.trim(),
        sortOrder: editingFaq ? editingFaq.sortOrder : defaultSortOrder,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl border border-amber-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="font-serif text-xl font-medium text-white">
            {editingFaq ? 'แก้ไขคำถาม FAQ' : 'เพิ่มคำถาม FAQ ใหม่'}
          </h2>
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
              คำถาม (Question) *
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="เช่น สั่งทำภาพ AI ต้องเตรียมอะไรบ้าง?"
              required
              className="w-full rounded-lg border border-white/15 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
              คำตอบ (Answer) *
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              placeholder="รายละเอียดคำตอบที่ชัดเจนและเข้าใจง่ายสำหรับลูกค้า"
              required
              className="w-full rounded-lg border border-white/15 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none leading-relaxed"
            />
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
              className="rounded-lg bg-white px-5 py-2 text-xs font-mono uppercase tracking-wider text-black font-semibold hover:bg-zinc-200 disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกคำถาม'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
