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
  Lock,
  Plus,
  LogOut,
  Sparkles,
  Layers,
  Calendar,
  User,
  Check,
  AlertCircle
} from 'lucide-react';
import { Album, Photo } from '@/lib/db';

interface AdminDashboardClientProps {
  initialAlbums: (Album & { photoCount?: number })[];
}

export default function AdminDashboardClient({ initialAlbums }: AdminDashboardClientProps) {
  const router = useRouter();
  const [albums, setAlbums] = useState(initialAlbums);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(
    initialAlbums[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'albums' | 'photos'>('albums');

  // Album creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDesc, setNewDesc] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [isSubmittingAlbum, setIsSubmittingAlbum] = useState(false);

  // Photos state for currently selected album
  const [currentPhotos, setCurrentPhotos] = useState<Photo[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  // Move files state
  const [targetAlbumId, setTargetAlbumId] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);

  // Uploading state
  const [uploadQueue, setUploadQueue] = useState<{ name: string; progress: number; status: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch photos for the selected album
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

  // Switch to photos tab and load album
  const handleSelectAlbumForPhotos = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setActiveTab('photos');
    loadAlbumPhotos(albumId);
  };

  // Logout handler
  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  // Create Album
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
          clientName: newClient,
          eventDate: newDate,
          description: newDesc,
          isPrivate: newIsPrivate,
          passcode: newPasscode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAlbums([data.album, ...albums]);
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewClient('');
        setNewDesc('');
        setNewPasscode('');
        setNewIsPrivate(false);
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

  // Delete Album
  const handleDeleteAlbum = async (albumId: string, title: string) => {
    if (!confirm(`คุณต้องการลบอัลบั้ม "${title}" และรูปภาพทั้งหมดในอัลบั้มนี้ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/albums/${albumId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAlbums(albums.filter((a) => a.id !== albumId));
        if (selectedAlbumId === albumId) {
          const remaining = albums.filter((a) => a.id !== albumId);
          setSelectedAlbumId(remaining[0]?.id || '');
          setCurrentPhotos([]);
        }
        showToast('ลบอัลบั้มเรียบร้อยแล้ว');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบอัลบั้ม', 'error');
    }
  };

  // Upload Photos Handler
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedAlbumId) return;

    setIsUploading(true);
    const fileArray = Array.from(files);

    const initialQueue = fileArray.map((f) => ({
      name: f.name,
      progress: 0,
      status: 'รอคิวอัปโหลดและแปลง WebP...',
    }));
    setUploadQueue(initialQueue);

    let successCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      setUploadQueue((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, progress: 40, status: 'กำลังบีบอัดและสร้าง WebP Thumbnail ด้วย Sharp...' } : item
        )
      );

      const formData = new FormData();
      formData.append('file', file);
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
          setUploadQueue((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, progress: 100, status: 'สำเร็จ!' } : item
            )
          );
        } else {
          setUploadQueue((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, progress: 100, status: 'เกิดข้อผิดพลาด' } : item
            )
          );
        }
      } catch {
        setUploadQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, progress: 100, status: 'อัปโหลดล้มเหลว' } : item
          )
        );
      }
    }

    // Refresh album photo count in list
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === selectedAlbumId
          ? { ...a, photoCount: (a.photoCount || 0) + successCount }
          : a
      )
    );

    setIsUploading(false);
    showToast(`อัปโหลดและแปลงภาพ WebP สำเร็จแล้ว ${successCount} รูป!`);
    setTimeout(() => setUploadQueue([]), 4000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Move Photos to another album (ย้ายไฟลข้ามอัลบั้ม)
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
        // Remove moved photos from current view
        setCurrentPhotos((prev) => prev.filter((p) => !selectedPhotoIds.includes(p.id)));
        setSelectedPhotoIds([]);

        // Update photo counts
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

  // Delete Selected Photos
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

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);
  const totalPhotosCount = albums.reduce((acc, a) => acc + (a.photoCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#090a0b] text-zinc-100 flex flex-col">
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
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white font-mono text-xs font-bold border border-white/15">
              LA
            </div>
            <div>
              <span className="font-serif text-sm font-semibold tracking-wide text-white uppercase">
                Lumen Atelier
              </span>
              <span className="ml-2 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                Admin Mode
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
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-white/[0.07] bg-zinc-950/60 p-4">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider">
              อัลบั้มทั้งหมด
            </span>
            <div className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-white">
              {albums.length}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-zinc-950/60 p-4">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider">
              รูปภาพในระบบ
            </span>
            <div className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-white">
              {totalPhotosCount}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-zinc-950/60 p-4">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider">
              การประมวลผล WebP
            </span>
            <div className="mt-2 font-mono text-xs text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Sharp Engine Active
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-zinc-950/60 p-4">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider">
              พื้นที่จัดเก็บ
            </span>
            <div className="mt-2 font-mono text-xs text-zinc-300">
              Local Storage (Free 100%)
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('albums')}
            className={`flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'albums'
                ? 'border-white text-white font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderPlus className="h-4 w-4" />
            <span>1. จัดการอัลบั้ม (Albums)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('photos');
              if (selectedAlbumId) loadAlbumPhotos(selectedAlbumId);
            }}
            className={`flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'photos'
                ? 'border-white text-white font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>2. อัปโหลดรูป & จัดการไฟล์ / ย้ายรูป (Photos)</span>
          </button>
        </div>

        {/* TAB 1: ALBUM MANAGEMENT */}
        {activeTab === 'albums' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-normal text-white">
                  รายการอัลบั้มทั้งหมด
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  สร้างและปรับแต่งอัลบั้มสำหรับส่งงานให้ลูกค้าแต่ละท่าน
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

            {/* Albums Table / Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => {
                const cover = album.coverImage || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80';

                return (
                  <div
                    key={album.id}
                    className="flex flex-col rounded-xl border border-white/[0.08] bg-zinc-950/80 overflow-hidden shadow-xl"
                  >
                    <div className="relative aspect-[16/9] w-full bg-zinc-900">
                      <Image
                        src={cover}
                        alt={album.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {album.isPrivate === 1 && (
                          <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-amber-300 border border-amber-500/30 backdrop-blur-md">
                            <Lock className="h-3 w-3" /> Private ({album.passcode})
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3 text-[11px] font-mono text-zinc-300">
                        {album.photoCount || 0} Photos
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        {album.clientName && (
                          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                            Client: {album.clientName}
                          </div>
                        )}
                        <h3 className="font-serif text-lg font-medium text-white line-clamp-1">
                          {album.title}
                        </h3>
                        {album.eventDate && (
                          <p className="text-xs font-mono text-zinc-500 mt-1">
                            {album.eventDate}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-white/[0.07]">
                        <button
                          type="button"
                          onClick={() => handleSelectAlbumForPhotos(album.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 py-2 text-xs font-mono text-white transition-colors"
                        >
                          <UploadCloud className="h-3.5 w-3.5" />
                          <span>จัดการรูป</span>
                        </button>

                        <Link
                          href={`/album/${album.slug}`}
                          target="_blank"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                          title="ดูหน้าแกลเลอรีจริง"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteAlbum(album.id, album.title)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
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

        {/* TAB 2: PHOTOS & FILE MANAGER (WITH MOVE FILES FEATURE) */}
        {activeTab === 'photos' && (
          <div className="space-y-8">
            {/* Album Picker for photos */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-zinc-950/70 p-5">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Layers className="h-5 w-5 text-zinc-400" />
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
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:border-white/30 focus:outline-none"
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
                <Link
                  href={`/album/${selectedAlbum.slug}`}
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                >
                  <span>เปิดดูอัลบั้มนี้ในหน้าบ้าน</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelected(e.dataTransfer.files);
              }}
              className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-zinc-950/40 p-8 sm:p-12 text-center hover:border-white/30 hover:bg-zinc-950/60 transition-all cursor-pointer"
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

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-4 text-zinc-300">
                <UploadCloud className="h-7 w-7" />
              </div>

              <h3 className="font-serif text-lg font-normal text-white">
                ลากและวางรูปภาพที่นี่ หรือคลิกเพื่อเลือกไฟล์
              </h3>
              <p className="mt-1 text-xs font-mono text-zinc-400 max-w-md">
                รองรับไฟล์ภาพหลายไฟล์พร้อมกัน ระบบจะทำการย่อขนาดและสร้าง WebP Thumbnail (600px, 1600px และ Blur LQIP) ให้อัตโนมัติทันที
              </p>

              <button
                type="button"
                className="mt-6 rounded-full bg-white/10 hover:bg-white/20 px-5 py-2 text-xs font-mono text-white transition-colors border border-white/10"
              >
                เลือกรูปภาพจากเครื่อง
              </button>
            </div>

            {/* Live Upload Queue Progress */}
            {uploadQueue.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-zinc-950 p-4 space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  สถานะการประมวลผลรูปภาพ ({uploadQueue.length} รูป)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {uploadQueue.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="truncate max-w-xs text-zinc-300">{item.name}</span>
                        <span className="text-zinc-400">{item.status}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
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

              {/* Action buttons when items are selected */}
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

                  {/* Set cover if 1 selected */}
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

                  {/* Delete Selected */}
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

            {/* Photos Grid */}
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
                {currentPhotos.map((photo) => {
                  const isSelected = selectedPhotoIds.includes(photo.id);

                  return (
                    <div
                      key={photo.id}
                      onClick={() => toggleSelectPhoto(photo.id)}
                      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all cursor-pointer ${
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
                          className="object-cover"
                        />

                        {/* Selection Checkbox */}
                        <div className="absolute top-2 left-2 z-10">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetCover(photo.thumbUrl);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 hover:bg-black text-zinc-300 hover:text-white"
                            title="ตั้งเป็นรูปปกอัลบั้ม"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePhotos([photo.id]);
                            }}
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
          </div>
        )}
      </div>

      {/* CREATE ALBUM MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
            <h2 className="font-serif text-xl font-medium text-white mb-1">
              สร้างอัลบั้มใหม่ (Create Album)
            </h2>
            <p className="text-xs font-mono text-zinc-400 mb-6">
              ระบุรายละเอียดของอัลบั้มสำหรับส่งงานให้ลูกค้า
            </p>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  ชื่ออัลบั้ม (Title) *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น Autumn Editorial Campaign หรือ งานแต่งคุณบอย & คุณแพร"
                  required
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    ชื่อลูกค้า (Client Name)
                  </label>
                  <input
                    type="text"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    placeholder="เช่น คุณกมลวรรณ หรือ Studio XYZ"
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    วันที่จัดงาน (Event Date)
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  คำอธิบายเพิ่มเติม (Description)
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="รายละเอียดเซ็ตภาพ บรรยากาศ หรือข้อความถึงลูกค้า"
                  className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none"
                />
              </div>

              {/* Private passcode checkbox */}
              <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newIsPrivate}
                    onChange={(e) => setNewIsPrivate(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800 text-white focus:ring-0"
                  />
                  <label htmlFor="isPrivate" className="text-xs font-mono text-zinc-300 cursor-pointer">
                    ตั้งเป็นอัลบั้มส่วนตัว (Private - ต้องใส่รหัสผ่านก่อนเข้าดู)
                  </label>
                </div>

                {newIsPrivate && (
                  <div>
                    <input
                      type="text"
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value)}
                      placeholder="กำหนดรหัสผ่าน เช่น 2026 หรือ secret"
                      className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
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
    </div>
  );
}
