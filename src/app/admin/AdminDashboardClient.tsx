'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FolderPlus,
  UploadCloud,
  ArrowRightLeft,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Plus,
  LogOut,
  Layers,
  Check,
  AlertCircle,
  HelpCircle,
  Megaphone,
  Eye,
  X,
  Edit2,
  Maximize2,
  Play
} from 'lucide-react';
import { Album, Photo, Announcement, FaqItem } from '@/lib/db';
import Lightbox from '@/components/Lightbox';

interface StagedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface AdminDashboardClientProps {
  initialAlbums: (Album & { photoCount?: number })[];
  initialAnnouncements: Announcement[];
  initialFaqs: FaqItem[];
}

export default function AdminDashboardClient({
  initialAlbums,
  initialAnnouncements,
  initialFaqs,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [albums, setAlbums] = useState(initialAlbums);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [faqs, setFaqs] = useState(initialFaqs);

  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(
    initialAlbums[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'albums' | 'photos' | 'announcements' | 'faqs'>('albums');

  // Album creation modal state (Simplified: only Title, Description, SortOrder)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSortOrder, setNewSortOrder] = useState<number>(0);
  const [isSubmittingAlbum, setIsSubmittingAlbum] = useState(false);

  // Edit Album modal
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  // Photos state for currently selected album
  const [currentPhotos, setCurrentPhotos] = useState<Photo[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  // Lightbox preview inside admin
  const [adminLightboxOpen, setAdminLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Move files state
  const [targetAlbumId, setTargetAlbumId] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);

  // Staged Uploading state
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Announcement state
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annLink, setAnnLink] = useState('');
  const [annSortOrder, setAnnSortOrder] = useState(0);
  const annFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAnn, setIsUploadingAnn] = useState(false);

  // FAQ modal state
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqSortOrder, setFaqSortOrder] = useState(0);

  // Toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load photos for selected album
  const loadAlbumPhotos = async (albumId: string) => {
    if (!albumId) return;
    setIsLoadingPhotos(true);
    setSelectedPhotoIds([]);
    try {
      const res = await fetch(`/api/albums/${albumId}`);
      const data = await res.json();
      if (data.success && data.album) {
        setCurrentPhotos(data.album.photos || []);
      }
    } catch {
      showToast('ไม่สามารถโหลดรูปภาพได้', 'error');
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handleSelectAlbumForPhotos = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setActiveTab('photos');
    loadAlbumPhotos(albumId);
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  // Create Album (Simplified)
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmittingAlbum(true);
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          sortOrder: Number(newSortOrder) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAlbums([...albums, data.album].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewSortOrder(0);
        showToast('สร้างอัลบั้มใหม่เรียบร้อยแล้ว!');
      } else {
        showToast(data.error || 'สร้างอัลบั้มไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
      setIsSubmittingAlbum(false);
    }
  };

  // Update Album
  const handleUpdateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum) return;

    try {
      const res = await fetch(`/api/albums/${editingAlbum.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingAlbum.title,
          description: editingAlbum.description,
          sortOrder: Number(editingAlbum.sortOrder) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAlbums(albums.map((a) => (a.id === editingAlbum.id ? { ...a, ...data.album } : a)).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
        setEditingAlbum(null);
        showToast('บันทึกการแก้ไขอัลบั้มเรียบร้อยแล้ว');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการแก้ไข', 'error');
    }
  };

  // Delete Album
  const handleDeleteAlbum = async (albumId: string, title: string) => {
    if (!confirm(`คุณต้องการลบอัลบั้ม "${title}" และรูปภาพทั้งหมดในอัลบั้มนี้ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/albums/${albumId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        const remaining = albums.filter((a) => a.id !== albumId);
        setAlbums(remaining);
        if (selectedAlbumId === albumId) {
          setSelectedAlbumId(remaining[0]?.id || '');
          setCurrentPhotos([]);
        }
        showToast('ลบอัลบั้มเรียบร้อยแล้ว');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบอัลบั้ม', 'error');
    }
  };

  // Handle Files Selected (Stage them in queue first)
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedAlbumId) return;

    const newFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (newFiles.length === 0) {
      showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
      return;
    }

    const newStaged: StagedPhoto[] = newFiles.map((file) => ({
      id: 'stg_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      file,
      previewUrl: URL.createObjectURL(file),
      size: file.size,
      status: 'pending',
      progress: 0,
    }));

    setStagedPhotos((prev) => [...prev, ...newStaged]);
    showToast(`เพิ่ม ${newStaged.length} รูปลงในคิวแล้ว ตรวจสอบรูปแล้วกด "เริ่มอัปโหลด" ได้เลยครับ`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove a single staged photo
  const handleRemoveStagedPhoto = (id: string) => {
    setStagedPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  // Clear all staged photos
  const handleClearStagedPhotos = () => {
    stagedPhotos.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    setStagedPhotos([]);
  };

  // Start uploading staged photos concurrently (Parallel upload 4 streams simultaneously)
  const handleStartUpload = async () => {
    if (stagedPhotos.length === 0 || !selectedAlbumId || isUploading) return;
    setIsUploading(true);

    let successCount = 0;
    const itemsToUpload = stagedPhotos.filter((p) => p.status !== 'success');
    const CONCURRENCY = 4; // Upload 4 photos simultaneously for 4-5x speedup

    let nextIndex = 0;

    const uploadWorker = async () => {
      while (nextIndex < itemsToUpload.length) {
        const item = itemsToUpload[nextIndex++];
        if (!item) break;

        setStagedPhotos((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: 'uploading', progress: 50 } : p))
        );

        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('albumId', selectedAlbumId);

        try {
          const res = await fetch('/api/photos', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (data.success && data.photo) {
            successCount++;
            setCurrentPhotos((prev) => [data.photo, ...prev]);
            setStagedPhotos((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, status: 'success', progress: 100 } : p))
            );
          } else {
            setStagedPhotos((prev) =>
              prev.map((p) =>
                p.id === item.id ? { ...p, status: 'error', progress: 100, error: data.error || 'ล้มเหลว' } : p
              )
            );
          }
        } catch {
          setStagedPhotos((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, status: 'error', progress: 100, error: 'เชื่อมต่อล้มเหลว' } : p
            )
          );
        }
      }
    };

    // Run workers in parallel
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, itemsToUpload.length) },
      () => uploadWorker()
    );

    await Promise.all(workers);

    setAlbums((prev) =>
      prev.map((a) =>
        a.id === selectedAlbumId
          ? { ...a, photoCount: (a.photoCount || 0) + successCount }
          : a
      )
    );

    setIsUploading(false);
    showToast(`🚀 อัปโหลดพร้อมกันสำเร็จแล้ว ${successCount} รูป!`);

    // Automatically remove successful items after 2 seconds
    setTimeout(() => {
      setStagedPhotos((prev) => prev.filter((p) => p.status !== 'success'));
    }, 2000);
  };

  // Move Photos to another album
  const handleMovePhotos = async () => {
    if (!targetAlbumId || selectedPhotoIds.length === 0) return;
    if (targetAlbumId === selectedAlbumId) {
      showToast('กรุณาเลือกอัลบั้มปลายทางที่ต่างจากเดิม', 'error');
      return;
    }

    setIsMoving(true);
    try {
      const res = await fetch('/api/photos/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoIds: selectedPhotoIds,
          targetAlbumId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`ย้ายรูปภาพจำนวน ${selectedPhotoIds.length} รูปเรียบร้อยแล้ว!`);
        setCurrentPhotos((prev) => prev.filter((p) => !selectedPhotoIds.includes(p.id)));
        setSelectedPhotoIds([]);

        setAlbums((prev) =>
          prev.map((a) => {
            if (a.id === selectedAlbumId) {
              return { ...a, photoCount: Math.max(0, (a.photoCount || 0) - selectedPhotoIds.length) };
            }
            if (a.id === targetAlbumId) {
              return { ...a, photoCount: (a.photoCount || 0) + selectedPhotoIds.length };
            }
            return a;
          })
        );
      } else {
        showToast(data.error || 'ย้ายรูปภาพไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการย้ายรูปภาพ', 'error');
    } finally {
      setIsMoving(false);
    }
  };

  // Delete Photos
  const handleDeletePhotos = async (ids: string[]) => {
    if (!confirm(`คุณแน่ใจว่าต้องการลบรูปที่เลือกจำนวน ${ids.length} รูปใช่หรือไม่?`)) return;

    try {
      const res = await fetch('/api/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: ids }),
      });

      const data = await res.json();
      if (data.success) {
        setCurrentPhotos((prev) => prev.filter((p) => !ids.includes(p.id)));
        setSelectedPhotoIds([]);
        setAlbums((prev) =>
          prev.map((a) =>
            a.id === selectedAlbumId
              ? { ...a, photoCount: Math.max(0, (a.photoCount || 0) - ids.length) }
              : a
          )
        );
        showToast(`ลบรูปภาพเรียบร้อยแล้ว ${ids.length} รูป`);
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบรูปภาพ', 'error');
    }
  };

  // Set Album Cover
  const handleSetCover = async (photoThumbUrl: string) => {
    try {
      const res = await fetch('/api/photos/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: selectedAlbumId,
          photoThumbUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAlbums((prev) =>
          prev.map((a) =>
            a.id === selectedAlbumId ? { ...a, coverImage: photoThumbUrl } : a
          )
        );
        showToast('ตั้งเป็นรูปปกอัลบั้มเรียบร้อยแล้ว!');
      }
    } catch {
      showToast('ไม่สามารถเปลี่ยนรูปปกได้', 'error');
    }
  };

  // Photo Selection
  const toggleSelectPhoto = (id: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhotoIds.length === currentPhotos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(currentPhotos.map((p) => p.id));
    }
  };

  // Announcement Handlers
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) {
      showToast('กรุณาระบุหัวข้อประกาศ', 'error');
      return;
    }

    const file = annFileInputRef.current?.files?.[0];
    setIsUploadingAnn(true);
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    formData.append('title', annTitle.trim());
    formData.append('content', annContent.trim());
    formData.append('linkUrl', annLink.trim());
    formData.append('sortOrder', String(annSortOrder));

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements([data.announcement, ...announcements]);
        setIsAnnModalOpen(false);
        setAnnTitle('');
        setAnnContent('');
        setAnnLink('');
        setAnnSortOrder(0);
        showToast('เพิ่มประกาศข่าวสารเรียบร้อยแล้ว');
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาดในการบันทึกประกาศ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
      setIsUploadingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบประกาศนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch('/api/announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(announcements.filter((a) => a.id !== id));
        showToast('ลบประกาศเรียบร้อยแล้ว');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบ', 'error');
    }
  };

  // FAQ Handlers
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;

    if (editingFaq) {
      // Edit existing FAQ
      try {
        const res = await fetch('/api/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingFaq.id,
            question: faqQuestion,
            answer: faqAnswer,
            sortOrder: faqSortOrder,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setFaqs(faqs.map((f) => (f.id === editingFaq.id ? data.faq : f)));
          setIsFaqModalOpen(false);
          setEditingFaq(null);
          showToast('บันทึกคำถาม FAQ เรียบร้อยแล้ว');
        }
      } catch {
        showToast('เกิดข้อผิดพลาดในการแก้ไข FAQ', 'error');
      }
    } else {
      // Create new FAQ
      try {
        const res = await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: faqQuestion,
            answer: faqAnswer,
            sortOrder: faqSortOrder,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setFaqs([...faqs, data.faq]);
          setIsFaqModalOpen(false);
          setFaqQuestion('');
          setFaqAnswer('');
          setFaqSortOrder(0);
          showToast('เพิ่มคำถาม FAQ ใหม่เรียบร้อยแล้ว');
        }
      } catch {
        showToast('เกิดข้อผิดพลาดในการเพิ่ม FAQ', 'error');
      }
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('ต้องการลบคำถามนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch('/api/faqs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setFaqs(faqs.filter((f) => f.id !== id));
        showToast('ลบคำถามเรียบร้อยแล้ว');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบคำถาม', 'error');
    }
  };

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);
  const totalPhotosCount = albums.reduce((acc, a) => acc + (a.photoCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#060709] text-zinc-100 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-mono shadow-2xl border backdrop-blur-xl animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/30 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Admin Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-500/15 border border-amber-500/25 p-1 shadow-md shadow-orange-500/10">
              <Image src="/logo.png" alt="Logo" width={26} height={26} className="object-contain" />
            </div>
            <div>
              <span className="font-serif text-sm font-semibold tracking-wide text-white uppercase">
                F-Secret AI Art
              </span>
              <span className="ml-2 rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                Admin Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-mono text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <span>ดูหน้าบ้าน</span>
              <ExternalLink className="h-3 w-3" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-mono text-zinc-400 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-white/[0.08] mb-8 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('albums')}
            className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'albums'
                ? 'border-amber-400 text-white font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderPlus className="h-4 w-4 text-amber-400" />
            <span>1. อัลบั้ม/แคตตาล็อก ({albums.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('photos');
              if (selectedAlbumId) loadAlbumPhotos(selectedAlbumId);
            }}
            className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'photos'
                ? 'border-amber-400 text-white font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UploadCloud className="h-4 w-4 text-emerald-400" />
            <span>2. อัปโหลดรูป & ย้ายไฟล์</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'announcements'
                ? 'border-amber-400 text-white font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Megaphone className="h-4 w-4 text-amber-400" />
            <span>3. ป้ายประกาศ & แนะนำรูป LoRA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faqs')}
            className={`flex items-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'faqs'
                ? 'border-amber-400 text-white font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HelpCircle className="h-4 w-4 text-sky-400" />
            <span>4. จัดการคำถามที่พบบ่อย (FAQ)</span>
          </button>
        </div>

        {/* TAB 1: ALBUM MANAGEMENT (SIMPLIFIED & SORTABLE) */}
        {activeTab === 'albums' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-normal text-white">
                  จัดการแคตตาล็อกสไตล์ภาพ ({albums.length} อัลบั้ม)
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  เพิ่ม/แก้ไขแคตตาล็อกสไตล์ภาพ พร้อมกำหนดลำดับการแสดงผล (เลขน้อยจะอยู่ด้านบนสุด)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-black font-semibold hover:bg-zinc-200 transition-colors shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>สร้างอัลบั้มใหม่</span>
              </button>
            </div>

            {/* Albums Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => {
                const cover = album.coverImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

                return (
                  <div
                    key={album.id}
                    className="flex flex-col rounded-2xl glass-panel overflow-hidden shadow-xl border border-white/[0.08]"
                  >
                    <div className="relative aspect-[16/9] w-full bg-zinc-950">
                      <Image
                        src={cover}
                        alt={album.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-amber-500/20 backdrop-blur-md px-2.5 py-0.5 font-mono text-[11px] text-amber-300 border border-amber-500/30">
                          ลำดับที่ {album.sortOrder ?? 0}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 text-[11px] font-mono text-zinc-300">
                        {album.photoCount || 0} ภาพตัวอย่าง
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-serif text-lg font-medium text-white line-clamp-1">
                          {album.title}
                        </h3>
                        {album.description && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 font-light">
                            {album.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-white/[0.07]">
                        <button
                          type="button"
                          onClick={() => handleSelectAlbumForPhotos(album.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 py-2 text-xs font-mono text-white transition-colors"
                        >
                          <UploadCloud className="h-3.5 w-3.5 text-emerald-400" />
                          <span>จัดการรูป</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingAlbum(album)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                          title="แก้ไขชื่อ/ลำดับ"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <Link
                          href={`/album/${album.slug}`}
                          target="_blank"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                          title="เปิดดูหน้าอัลบั้มเต็ม (Preview)"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteAlbum(album.id, album.title)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
                          title="ลบอัลบั้ม"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PHOTOS & FILE MANAGER (WITH FULL ALBUM PREVIEW & LIGHTBOX) */}
        {activeTab === 'photos' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl glass-panel p-5">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Layers className="h-5 w-5 text-amber-400" />
                <div className="flex-1 sm:w-80">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    เลือกอัลบั้มที่ต้องการจัดการ
                  </label>
                  <select
                    value={selectedAlbumId}
                    onChange={(e) => {
                      setSelectedAlbumId(e.target.value);
                      loadAlbumPhotos(e.target.value);
                    }}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:outline-none"
                  >
                    {albums.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.photoCount || 0} รูป)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedAlbum && (
                <div className="flex items-center gap-3">
                  <Link
                    href={`/album/${selectedAlbum.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 text-xs font-mono text-amber-300 hover:bg-amber-500/30 transition-all font-semibold"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>เปิดดูหน้าอัลบั้มเต็ม (Preview Full Album)</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelected(e.dataTransfer.files);
              }}
              className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-zinc-950/40 p-8 sm:p-12 text-center hover:border-amber-500/40 hover:bg-zinc-950/60 transition-all cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 mb-4 text-amber-300">
                <UploadCloud className="h-7 w-7" />
              </div>

              <h3 className="font-serif text-lg font-normal text-white">
                ลากและวางรูปภาพที่นี่ หรือคลิกเพื่อเลือกไฟล์
              </h3>
              <p className="mt-1 text-xs font-mono text-zinc-400 max-w-md font-light">
                ระบบจะทำการย่อขนาดและสร้าง WebP Thumbnail (600px, 1600px และ Blur LQIP) ให้อัตโนมัติทันที
              </p>

              <button
                type="button"
                className="mt-6 rounded-full bg-white/10 hover:bg-white/20 px-5 py-2 text-xs font-mono text-white transition-colors border border-white/10"
              >
                เลือกรูปภาพจากเครื่อง
              </button>
            </div>

            {/* STAGED PHOTOS TRAY (รายการรูปที่รออัปโหลด) */}
            {stagedPhotos.length > 0 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-5 sm:p-6 space-y-4 shadow-2xl animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h4 className="font-serif text-base sm:text-lg font-medium text-white flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                        {stagedPhotos.length}
                      </span>
                      <span>คิวรูปภาพที่เลือกไว้ (รอการยืนยันอัปโหลด)</span>
                    </h4>
                    <p className="text-xs font-mono text-zinc-400 mt-1">
                      ขนาดรวม:{' '}
                      {(
                        stagedPhotos.reduce((acc, curr) => acc + curr.size, 0) /
                        1024 /
                        1024
                      ).toFixed(2)}{' '}
                      MB · สามารถกด [×] บนรูปเพื่อเอาออก หรือกดเลือกไฟล์เพิ่มได้
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={handleClearStagedPhotos}
                      className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 px-3.5 py-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                    >
                      ล้างคิวทั้งหมด
                    </button>

                    <button
                      type="button"
                      disabled={isUploading || stagedPhotos.every((p) => p.status === 'success')}
                      onClick={handleStartUpload}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-50 px-5 py-2 text-xs font-mono uppercase tracking-wider text-white font-bold transition-all shadow-lg shadow-orange-500/25 hover:scale-105"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{isUploading ? 'กำลังอัปโหลด...' : `🚀 เริ่มอัปโหลด (${stagedPhotos.length} รูป)`}</span>
                    </button>
                  </div>
                </div>

                {/* Staged Thumbnails Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-80 overflow-y-auto pr-1">
                  {stagedPhotos.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl overflow-hidden border border-white/10 bg-zinc-950/80 shadow-md"
                    >
                      <div className="relative aspect-square w-full">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-transparent transition-colors" />

                        {/* Status Overlay */}
                        {item.status === 'uploading' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-2 text-center">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent mb-1" />
                            <span className="text-[10px] font-mono text-amber-300">กำลังส่ง...</span>
                          </div>
                        )}

                        {item.status === 'success' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/85 p-2 text-center">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400 mb-1" />
                            <span className="text-[10px] font-mono text-emerald-300">สำเร็จ!</span>
                          </div>
                        )}

                        {item.status === 'error' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/85 p-2 text-center">
                            <AlertCircle className="h-6 w-6 text-rose-400 mb-1" />
                            <span className="text-[10px] font-mono text-rose-300">ล้มเหลว</span>
                          </div>
                        )}

                        {/* Remove button (only if not uploading) */}
                        {!isUploading && item.status !== 'success' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStagedPhoto(item.id)}
                            className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 hover:bg-rose-600 text-zinc-300 hover:text-white transition-all shadow-md"
                            title="ลบรูปนี้ออกจากคิว"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="p-2 text-[10px] font-mono text-zinc-400 truncate">
                        <p className="truncate text-zinc-200" title={item.file.name}>
                          {item.file.name}
                        </p>
                        <span className="text-zinc-500">
                          {(item.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BATCH ACTIONS TOOLBAR (ย้ายไฟล์ / ลบไฟล์) */}
            <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-mono text-white transition-colors"
                >
                  {selectedPhotoIds.length === currentPhotos.length && currentPhotos.length > 0
                    ? 'ยกเลิกการเลือกทั้งหมด'
                    : 'เลือกทั้งหมด'}
                </button>

                <span className="text-xs font-mono text-zinc-400">
                  เลือกอยู่ <span className="text-white font-bold">{selectedPhotoIds.length}</span> จาก {currentPhotos.length} รูป
                </span>
              </div>

              {selectedPhotoIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 animate-fade-in">
                  {/* ⭐ MOVE PHOTOS TO ANOTHER ALBUM FEATURE */}
                  <div className="flex items-center gap-1.5 bg-black/60 rounded-lg p-1 border border-white/10">
                    <select
                      value={targetAlbumId}
                      onChange={(e) => setTargetAlbumId(e.target.value)}
                      className="rounded border border-white/10 bg-zinc-800 px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
                    >
                      <option value="">เลือกอัลบั้มปลายทาง...</option>
                      {albums
                        .filter((a) => a.id !== selectedAlbumId)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title}
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      disabled={!targetAlbumId || isMoving}
                      onClick={handleMovePhotos}
                      className="flex items-center gap-1.5 rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-3 py-1 text-xs font-mono text-black font-semibold transition-colors"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                      <span>{isMoving ? 'กำลังย้าย...' : 'ย้ายไฟล์'}</span>
                    </button>
                  </div>

                  {selectedPhotoIds.length === 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetPhoto = currentPhotos.find((p) => p.id === selectedPhotoIds[0]);
                        if (targetPhoto) handleSetCover(targetPhoto.thumbUrl);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 px-3 py-1.5 text-xs font-mono text-zinc-200 transition-colors"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>ตั้งเป็นรูปปก</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeletePhotos(selectedPhotoIds)}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-3 py-1.5 text-xs font-mono text-rose-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ลบ ({selectedPhotoIds.length})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Photos Grid with Lightbox on click */}
            {isLoadingPhotos ? (
              <div className="py-20 text-center font-mono text-xs text-zinc-500">
                กำลังโหลดรูปภาพ...
              </div>
            ) : currentPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-16 text-center">
                <ImageIcon className="h-10 w-10 text-zinc-600 mb-3" />
                <p className="text-sm font-mono text-zinc-400">
                  ยังไม่มีรูปภาพในอัลบั้มนี้ ลากไฟล์ใส่ด้านบนเพื่อเริ่มอัปโหลดได้เลยครับ
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {currentPhotos.map((photo, index) => {
                  const isSelected = selectedPhotoIds.includes(photo.id);

                  return (
                    <div
                      key={photo.id}
                      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20'
                          : 'border-white/[0.08] bg-zinc-950 hover:border-white/20'
                      }`}
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-zinc-900">
                        <Image
                          src={photo.thumbUrl || photo.originalUrl}
                          alt={photo.originalName}
                          fill
                          sizes="(max-width: 640px) 50vw, 20vw"
                          className="object-cover cursor-pointer"
                          onClick={() => {
                            setActivePhotoIndex(index);
                            setAdminLightboxOpen(true);
                          }}
                        />

                        {/* Selection Checkbox */}
                        <div
                          className="absolute top-2 left-2 z-10 cursor-pointer"
                          onClick={() => toggleSelectPhoto(photo.id)}
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-md border backdrop-blur-md transition-all ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-500 text-black'
                                : 'bg-black/60 border-white/30 text-transparent group-hover:border-white/60'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        </div>

                        {/* Top Right Quick Actions */}
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setActivePhotoIndex(index);
                              setAdminLightboxOpen(true);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 hover:bg-black text-zinc-300 hover:text-white"
                            title="ดูรูปขนาดเต็ม"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetCover(photo.thumbUrl)}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 hover:bg-black text-zinc-300 hover:text-white"
                            title="ตั้งเป็นรูปปกอัลบั้ม"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePhotos([photo.id])}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 hover:bg-rose-900 text-zinc-300 hover:text-rose-200"
                            title="ลบรูปนี้"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Photo Metadata Footer */}
                      <div className="p-2.5 bg-zinc-950 text-[10px] font-mono text-zinc-400 space-y-0.5">
                        <p className="truncate text-zinc-200" title={photo.originalName}>
                          {photo.originalName}
                        </p>
                        <div className="flex justify-between text-zinc-500">
                          <span>{photo.width}×{photo.height}</span>
                          <span>{(photo.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Admin Fullscreen Lightbox Preview */}
            <Lightbox
              photos={currentPhotos}
              currentIndex={activePhotoIndex}
              isOpen={adminLightboxOpen}
              onClose={() => setAdminLightboxOpen(false)}
              onNavigate={(newIndex) => setActivePhotoIndex(newIndex)}
            />
          </div>
        )}

        {/* TAB 3: ANNOUNCEMENTS & LORA GUIDE MANAGER */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-normal text-white">
                  จัดการป้ายประกาศ & ข่าวสาร ({announcements.length} รายการ)
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  เพิ่มประกาศข้อความ หรือแนบภาพแบนเนอร์แนวนอน เพื่อแจ้งข้อมูลและข่าวสารที่หน้าแรก
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAnnModalOpen(true)}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-black font-semibold hover:bg-zinc-200 transition-colors shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>+ เพิ่มประกาศใหม่</span>
              </button>
            </div>

            {/* Infographic Tips Box for Mobile Size */}
            <div className="rounded-xl glass-panel p-5 border border-amber-500/20 bg-amber-500/[0.03] space-y-2">
              <h4 className="font-serif text-sm font-semibold text-amber-300 flex items-center gap-2">
                💡 คำแนะนำขนาดรูปภาพสำหรับแบนเนอร์แนวนอนบนมือถือ
              </h4>
              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                • <strong>อัตราส่วนที่แนะนำ:</strong> แนวนอนแบบ <strong>16:9</strong> (เช่น <strong>1200 x 675 px</strong> หรือ <strong>1920 x 1080 px</strong>) หรือ <strong>2:1</strong> (เช่น <strong>1200 x 600 px</strong>)<br />
                • <strong>เหตุผล:</strong> บนจอมือถือ แนวนอนขนาดนี้จะกว้างพอดีจอ ไม่กินความสูงเกินไป และตัวหนังสือในภาพจะใหญ่คมชัดอ่านง่ายที่สุดครับ<br />
                • <strong>ประกาศแบบข้อความ:</strong> ไม่จำเป็นต้องแนบรูปภาพ ระบบจะจัดแสดงเป็นการ์ดข้อความสวยงามหรูหราให้โดยอัตโนมัติ
              </p>
            </div>

            {/* Announcements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.map((ann) => (
                <div key={ann.id} className="rounded-2xl glass-panel overflow-hidden border border-white/10 shadow-xl flex flex-col justify-between">
                  {ann.imageUrl ? (
                    <div className="relative aspect-[16/9] w-full bg-zinc-950 border-b border-white/5">
                      <Image
                        src={ann.imageUrl}
                        alt={ann.title}
                        fill
                        className="object-contain sm:object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="p-5 flex items-start justify-between gap-4 flex-1">
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-serif text-base font-medium text-white">
                        {ann.title}
                      </h4>
                      {ann.content && (
                        <p className="text-xs text-zinc-300 font-light line-clamp-3 whitespace-pre-line leading-relaxed">
                          {ann.content}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">ลำดับที่ {ann.sortOrder}</span>
                        {ann.linkUrl && (
                          <a
                            href={ann.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-amber-400 hover:underline truncate max-w-[200px]"
                          >
                            🔗 {ann.linkUrl}
                          </a>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 shrink-0"
                      title="ลบประกาศนี้"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: FAQ MANAGER */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-normal text-white">
                  จัดการคำถามที่พบบ่อย (FAQs) ({faqs.length} คำถาม)
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  แก้ไขคำถาม-คำตอบที่แสดงบนหน้าแรกของเว็บ เพื่อตอบข้อสงสัยให้ลูกค้าได้อย่างตรงจุด
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingFaq(null);
                  setFaqQuestion('');
                  setFaqAnswer('');
                  setFaqSortOrder(faqs.length + 1);
                  setIsFaqModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-black font-semibold hover:bg-zinc-200 transition-colors shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>+ เพิ่มคำถามใหม่</span>
              </button>
            </div>

            {/* FAQs List */}
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="rounded-xl glass-panel p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                        ลำดับที่ {faq.sortOrder}
                      </span>
                      <h4 className="font-serif text-base font-medium text-white">
                        {faq.question}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaq(faq);
                        setFaqQuestion(faq.question);
                        setFaqAnswer(faq.answer);
                        setFaqSortOrder(faq.sortOrder);
                        setIsFaqModalOpen(true);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                      title="แก้ไขคำถามนี้"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      title="ลบคำถามนี้"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE ALBUM MODAL (SIMPLIFIED: TITLE, DESC, SORT ORDER) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl">
            <h2 className="font-serif text-xl font-medium text-white mb-1">
              สร้างอัลบั้ม / สไตล์ภาพใหม่
            </h2>
            <p className="text-xs font-mono text-zinc-400 mb-6 font-light">
              ระบุชื่อสไตล์และรายละเอียดสำหรับโชว์ตัวอย่างผลงาน
            </p>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  ชื่ออัลบั้ม / สไตล์ภาพ *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น Realistic AI Model, Minimalist Cafe, Cyberpunk"
                  required
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  คำอธิบายสไตล์ภาพ
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="อธิบายมูดแอนด์โทน จุดเด่น หรือแนวทางของภาพสไตล์นี้"
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  ลำดับการแสดงผล (Sort Order)
                </label>
                <input
                  type="number"
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(Number(e.target.value))}
                  placeholder="0, 1, 2... (เลขน้อยจะขึ้นก่อน)"
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none font-mono"
                />
                <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                  ใส่อันดับ เช่น 1 สำหรับอันแรกสุด, 2 สำหรับอันถัดไป
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAlbum}
                  className="rounded-lg bg-white px-5 py-2 text-xs font-mono uppercase tracking-wider text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {isSubmittingAlbum ? 'กำลังบันทึก...' : 'สร้างอัลบั้ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ALBUM MODAL */}
      {editingAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl">
            <h2 className="font-serif text-xl font-medium text-white mb-4">
              แก้ไขข้อมูลอัลบั้ม
            </h2>

            <form onSubmit={handleUpdateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  ชื่ออัลบั้ม
                </label>
                <input
                  type="text"
                  value={editingAlbum.title}
                  onChange={(e) => setEditingAlbum({ ...editingAlbum, title: e.target.value })}
                  required
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  value={editingAlbum.description || ''}
                  onChange={(e) => setEditingAlbum({ ...editingAlbum, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  ลำดับการแสดงผล (Sort Order)
                </label>
                <input
                  type="number"
                  value={editingAlbum.sortOrder ?? 0}
                  onChange={(e) => setEditingAlbum({ ...editingAlbum, sortOrder: Number(e.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingAlbum(null)}
                  className="rounded-lg px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-white px-5 py-2 text-xs font-mono uppercase tracking-wider text-black font-semibold hover:bg-zinc-200"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl my-8">
            <h2 className="font-serif text-xl font-medium text-white mb-1">
              เพิ่มประกาศข่าวสาร / ข้อความแจ้งเตือน
            </h2>
            <p className="text-xs font-mono text-zinc-400 mb-6 font-light">
              สามารถระบุข้อความประกาศอย่างเดียว หรือแนบรูปภาพแบนเนอร์แนวนอน 16:9 เพิ่มเติมได้
            </p>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  หัวข้อประกาศ *
                </label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="เช่น เปิดรับคิวงานสร้างภาพ AI ประจำสัปดาห์นี้"
                  required
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  เนื้อหาประกาศ (ข้อความรายละเอียด)
                </label>
                <textarea
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="พิมพ์ข้อความรายละเอียดประกาศ แจ้งข้อมูล ข่าวสาร หรือโปรโมชั่น..."
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  รูปภาพแบนเนอร์ (ไม่บังคับ - แนะนำแนวนอน 16:9 เช่น 1200x675)
                </label>
                <input
                  ref={annFileInputRef}
                  type="file"
                  accept="image/*"
                  className="w-full text-xs font-mono text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  ลิงก์ปลายทาง (ไม่บังคับ เช่น LINE หรือลิงก์ภายนอก)
                </label>
                <input
                  type="text"
                  value={annLink}
                  onChange={(e) => setAnnLink(e.target.value)}
                  placeholder="https://line.me/ti/p/~tatchaihot"
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  ลำดับการแสดงผล (0 ขึ้นก่อน)
                </label>
                <input
                  type="number"
                  value={annSortOrder}
                  onChange={(e) => setAnnSortOrder(Number(e.target.value))}
                  placeholder="0, 1, 2..."
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploadingAnn}
                  className="rounded-lg bg-white px-5 py-2 text-xs font-mono uppercase tracking-wider text-black font-semibold hover:bg-zinc-200 disabled:opacity-50"
                >
                  {isUploadingAnn ? 'กำลังบันทึก...' : 'บันทึกประกาศ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ MODAL (ADD / EDIT) */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl">
            <h2 className="font-serif text-xl font-medium text-white mb-4">
              {editingFaq ? 'แก้ไขคำถาม FAQ' : 'เพิ่มคำถาม FAQ ใหม่'}
            </h2>

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  คำถาม (Question) *
                </label>
                <input
                  type="text"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="เช่น สั่งทำภาพ AI ต้องเตรียมอะไรบ้าง?"
                  required
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  คำตอบ (Answer) *
                </label>
                <textarea
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  rows={4}
                  placeholder="รายละเอียดคำตอบที่ชัดเจนและเข้าใจง่ายสำหรับลูกค้า"
                  required
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  ลำดับการแสดงผล (Sort Order)
                </label>
                <input
                  type="number"
                  value={faqSortOrder}
                  onChange={(e) => setFaqSortOrder(Number(e.target.value))}
                  placeholder="1, 2, 3..."
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-white px-5 py-2 text-xs font-mono uppercase tracking-wider text-black font-semibold hover:bg-zinc-200"
                >
                  บันทึกคำถาม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
