'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  EyeOff,
  X,
  Edit2,
  Maximize2,
  Play,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowLeft,
  ArrowRight,
  Lock,
  Copy,
  Star,
} from 'lucide-react';
import { Album, Photo, Announcement, FaqItem } from '@/lib/db';
import Lightbox from '@/components/Lightbox';
import AlbumCoverGrid from '@/components/AlbumCoverGrid';
import AlbumFormModal, { AlbumFormValues } from './components/AlbumFormModal';
import AnnouncementModal from './components/AnnouncementModal';
import FaqModal from './components/FaqModal';

interface StagedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  size: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface AdminDashboardClientProps {
  initialAlbums: (Album & { photoCount?: number })[];
  initialAnnouncements: Announcement[];
  initialFaqs: FaqItem[];
}

function arrayMove<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function setRootDragging(active: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('is-dragging', active);
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

  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(initialAlbums[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'albums' | 'photos' | 'announcements' | 'faqs'>('albums');

  // Unified Album Create / Edit modal state
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  // Drag-and-drop & live status for reordering
  const [armedDragKey, setArmedDragKey] = useState<string | null>(null);
  const [draggingAlbumId, setDraggingAlbumId] = useState<string | null>(null);
  const [dragOverAlbumId, setDragOverAlbumId] = useState<string | null>(null);
  const [isSavingAlbumOrder, setIsSavingAlbumOrder] = useState(false);
  const [reorderStatus, setReorderStatus] = useState('');

  // Photos state for currently selected album
  const [currentPhotos, setCurrentPhotos] = useState<Photo[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const lastSelectedPhotoIdRef = useRef<string | null>(null);
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null);
  const [dragOverPhotoId, setDragOverPhotoId] = useState<string | null>(null);

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
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [draggingAnnId, setDraggingAnnId] = useState<string | null>(null);
  const [dragOverAnnId, setDragOverAnnId] = useState<string | null>(null);

  // FAQ modal state
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [draggingFaqId, setDraggingFaqId] = useState<string | null>(null);
  const [dragOverFaqId, setDragOverFaqId] = useState<string | null>(null);

  // Toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Ensure root grabbing class & drag state are always cleared on pointerup
  useEffect(() => {
    const clearArm = () => {
      setArmedDragKey(null);
      setRootDragging(false);
    };
    window.addEventListener('pointerup', clearArm);
    window.addEventListener('pointercancel', clearArm);
    return () => {
      window.removeEventListener('pointerup', clearArm);
      window.removeEventListener('pointercancel', clearArm);
      setRootDragging(false);
    };
  }, []);

  const syncAlbumPreviews = useCallback((albumId: string, photos: Photo[]) => {
    const nextPreviews = photos
      .map((p) => p.thumbUrl || p.previewUrl || p.originalUrl)
      .filter(Boolean)
      .slice(0, 4);
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === albumId
          ? {
              ...a,
              photoCount: photos.length,
              previewPhotos:
                a.coverImage && nextPreviews.includes(a.coverImage)
                  ? [a.coverImage, ...nextPreviews.filter((u) => u !== a.coverImage)].slice(0, 4)
                  : nextPreviews,
            }
          : a
      )
    );
  }, []);

  // Load photos for selected album
  const loadAlbumPhotos = async (albumId: string) => {
    if (!albumId) return;
    setIsLoadingPhotos(true);
    setSelectedPhotoIds([]);
    lastSelectedPhotoIdRef.current = null;
    try {
      const res = await fetch(`/api/albums/${albumId}`);
      const data = await res.json();
      if (data.success && data.album) {
        const loaded: Photo[] = data.album.photos || [];
        setCurrentPhotos(loaded);
        syncAlbumPreviews(albumId, loaded);
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

  // ---------------- ALBUMS CRUD & REORDER ----------------
  const persistAlbumOrder = async (nextAlbums: (Album & { photoCount?: number })[], announcementText: string) => {
    const normalized = nextAlbums.map((a, idx) => ({ ...a, sortOrder: idx + 1 }));
    setAlbums(normalized);
    setReorderStatus(announcementText);
    setIsSavingAlbumOrder(true);
    try {
      const res = await fetch('/api/albums/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: normalized.map((a) => a.id) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('บันทึกลำดับแคตตาล็อกเรียบร้อยแล้ว!');
        router.refresh();
      } else {
        showToast(data.error || 'บันทึกลำดับไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการบันทึกลำดับ', 'error');
    } finally {
      setIsSavingAlbumOrder(false);
    }
  };

  const handleMoveAlbumIndex = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= albums.length) return;
    const movedTitle = albums[fromIndex]?.title || 'อัลบั้ม';
    const next = arrayMove(albums, fromIndex, toIndex);
    persistAlbumOrder(next, `ย้าย "${movedTitle}" ไปอยู่ที่อันดับ ${toIndex + 1} จาก ${next.length}`);
  };

  const handleSaveAlbumModal = async (values: AlbumFormValues) => {
    if (editingAlbum) {
      try {
        const res = await fetch(`/api/albums/${editingAlbum.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: values.title,
            description: values.description,
            clientName: values.clientName,
            eventDate: values.eventDate,
            isPrivate: values.isPrivate,
            passcode: values.isPrivate ? values.passcode : '',
          }),
        });
        const data = await res.json();
        if (data.success && data.album) {
          setAlbums((prev) =>
            prev.map((a) =>
              a.id === editingAlbum.id
                ? {
                    ...a,
                    ...data.album,
                    photoCount: a.photoCount,
                    previewPhotos: a.previewPhotos,
                  }
                : a
            )
          );
          setIsAlbumModalOpen(false);
          setEditingAlbum(null);
          showToast('บันทึกข้อมูลอัลบั้มเรียบร้อยแล้ว!');
          router.refresh();
        } else {
          showToast(data.error || 'บันทึกการแก้ไขไม่สำเร็จ', 'error');
        }
      } catch {
        showToast('เกิดข้อผิดพลาดในการแก้ไข', 'error');
      }
    } else {
      try {
        const res = await fetch('/api/albums', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: values.title,
            description: values.description,
            clientName: values.clientName,
            eventDate: values.eventDate,
            isPrivate: values.isPrivate,
            passcode: values.isPrivate ? values.passcode : '',
            placeAtTop: values.placeAtTop,
            sortOrder: values.placeAtTop ? 1 : albums.length + 1,
          }),
        });
        const data = await res.json();
        if (data.success && data.album) {
          const newAlb: Album = { ...data.album, photoCount: 0, previewPhotos: [] };
          setAlbums((prev) => {
            const next = values.placeAtTop ? [newAlb, ...prev] : [...prev, newAlb];
            return next.map((a, idx) => ({ ...a, sortOrder: idx + 1 }));
          });
          setIsAlbumModalOpen(false);
          showToast('สร้างอัลบั้มใหม่เรียบร้อยแล้ว!');
          router.refresh();
        } else {
          showToast(data.error || 'สร้างอัลบั้มไม่สำเร็จ', 'error');
        }
      } catch {
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
      }
    }
  };

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
        router.refresh();
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบอัลบั้ม', 'error');
    }
  };

  const handleCopyAlbumLink = (slug: string, title: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/album/${slug}`;
    navigator.clipboard.writeText(url);
    showToast(`คัดลอกลิงก์ "${title}" แล้ว!`);
  };

  // ---------------- PHOTOS STAGE, PASTE, UPLOAD, MOVE, DELETE, REORDER ----------------
  const stageImageFiles = useCallback(
    (rawFiles: File[]) => {
      if (!selectedAlbumId || rawFiles.length === 0) return;
      const imageFiles = rawFiles.filter((file) => file.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
        return;
      }

      const newStaged: StagedPhoto[] = imageFiles.map((file) => ({
        id: 'stg_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        file,
        previewUrl: URL.createObjectURL(file),
        size: file.size,
        status: 'pending',
      }));

      setStagedPhotos((prev) => [...prev, ...newStaged]);
      showToast(`เพิ่ม ${newStaged.length} รูปลงในคิวแล้ว กด "เริ่มอัปโหลด" ได้เลยนะคะ`);
    },
    [selectedAlbumId, showToast]
  );

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    stageImageFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Support Ctrl+V pasting screenshots/images into Tab 2
  useEffect(() => {
    if (activeTab !== 'photos') return;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }
      const items = Array.from(e.clipboardData?.items || []);
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        stageImageFiles(files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [activeTab, stageImageFiles]);

  const handleRemoveStagedPhoto = (id: string) => {
    setStagedPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleClearStagedPhotos = () => {
    stagedPhotos.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    setStagedPhotos([]);
  };

  const handleStartUpload = async () => {
    if (stagedPhotos.length === 0 || !selectedAlbumId || isUploading) return;
    setIsUploading(true);

    let successCount = 0;
    const uploadedPhotos: Photo[] = [];
    const itemsToUpload = stagedPhotos.filter((p) => p.status !== 'success');
    const CONCURRENCY = 4;
    let nextIndex = 0;

    const uploadWorker = async () => {
      while (nextIndex < itemsToUpload.length) {
        const item = itemsToUpload[nextIndex++];
        if (!item) break;

        setStagedPhotos((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: 'uploading' } : p))
        );

        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('albumId', selectedAlbumId);

        try {
          const res = await fetch('/api/photos', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success && data.photo) {
            successCount++;
            uploadedPhotos.push(data.photo);
            setCurrentPhotos((prev) => [data.photo, ...prev]);
            setStagedPhotos((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, status: 'success' } : p))
            );
          } else {
            setStagedPhotos((prev) =>
              prev.map((p) =>
                p.id === item.id ? { ...p, status: 'error', error: data.error || 'ล้มเหลว' } : p
              )
            );
          }
        } catch {
          setStagedPhotos((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, status: 'error', error: 'เชื่อมต่อล้มเหลว' } : p
            )
          );
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY, itemsToUpload.length) },
      () => uploadWorker()
    );
    await Promise.all(workers);

    if (uploadedPhotos.length > 0) {
      setCurrentPhotos((latest) => {
        syncAlbumPreviews(selectedAlbumId, latest);
        return latest;
      });
    }

    setIsUploading(false);
    showToast(`อัปโหลดสำเร็จแล้ว ${successCount} รูป!`);
    router.refresh();

    setTimeout(() => {
      setStagedPhotos((prev) => prev.filter((p) => p.status !== 'success'));
    }, 2000);
  };

  const persistPhotoOrder = async (nextPhotos: Photo[]) => {
    if (!selectedAlbumId) return;
    setCurrentPhotos(nextPhotos);
    syncAlbumPreviews(selectedAlbumId, nextPhotos);
    setReorderStatus(`อัปเดตลำดับรูปภาพในอัลบั้ม (${nextPhotos.length} รูป)`);
    try {
      const res = await fetch('/api/photos/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: selectedAlbumId,
          orderedPhotoIds: nextPhotos.map((p) => p.id),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('บันทึกลำดับรูปภาพเรียบร้อยแล้ว!');
        router.refresh();
      } else {
        showToast(data.error || 'บันทึกลำดับรูปภาพไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการบันทึกลำดับรูปภาพ', 'error');
    }
  };

  const handleMovePhotoIndex = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= currentPhotos.length) return;
    persistPhotoOrder(arrayMove(currentPhotos, fromIndex, toIndex));
  };

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
        body: JSON.stringify({ photoIds: selectedPhotoIds, targetAlbumId }),
      });

      const data = await res.json();
      if (data.success) {
        const remaining = currentPhotos.filter((p) => !selectedPhotoIds.includes(p.id));
        const movedCount = selectedPhotoIds.length;
        setCurrentPhotos(remaining);
        setSelectedPhotoIds([]);
        lastSelectedPhotoIdRef.current = null;
        setAlbums((prev) =>
          prev.map((a) => {
            if (a.id === selectedAlbumId) {
              return {
                ...a,
                photoCount: remaining.length,
                previewPhotos: remaining.map((p) => p.thumbUrl || p.previewUrl || p.originalUrl).slice(0, 4),
              };
            }
            if (a.id === targetAlbumId) {
              return { ...a, photoCount: (a.photoCount || 0) + movedCount };
            }
            return a;
          })
        );
        showToast(`ย้ายรูปภาพจำนวน ${movedCount} รูปเรียบร้อยแล้ว!`);
        router.refresh();
      } else {
        showToast(data.error || 'ย้ายรูปภาพไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการย้ายรูปภาพ', 'error');
    } finally {
      setIsMoving(false);
    }
  };

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
        const remaining = currentPhotos.filter((p) => !ids.includes(p.id));
        setCurrentPhotos(remaining);
        setSelectedPhotoIds((prev) => prev.filter((id) => !ids.includes(id)));
        lastSelectedPhotoIdRef.current = null;
        syncAlbumPreviews(selectedAlbumId, remaining);
        showToast(`ลบรูปภาพเรียบร้อยแล้ว ${ids.length} รูป`);
        router.refresh();
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบรูปภาพ', 'error');
    }
  };

  const handleSetCover = async (photoThumbUrl: string) => {
    try {
      const res = await fetch('/api/photos/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: selectedAlbumId, photoThumbUrl }),
      });

      const data = await res.json();
      if (data.success) {
        setAlbums((prev) =>
          prev.map((a) => {
            if (a.id !== selectedAlbumId) return a;
            const currentPreviews = a.previewPhotos || [];
            const nextPreviews = [
              photoThumbUrl,
              ...currentPreviews.filter((u) => u !== photoThumbUrl),
            ].slice(0, 4);
            return { ...a, coverImage: photoThumbUrl, previewPhotos: nextPreviews };
          })
        );
        showToast('ตั้งเป็นรูปปกอัลบั้มเรียบร้อยแล้ว!');
        router.refresh();
      }
    } catch {
      showToast('ไม่สามารถเปลี่ยนรูปปกได้', 'error');
    }
  };

  const toggleSelectPhoto = (id: string, shiftKey = false) => {
    if (shiftKey && lastSelectedPhotoIdRef.current) {
      const startIdx = currentPhotos.findIndex((p) => p.id === lastSelectedPhotoIdRef.current);
      const endIdx = currentPhotos.findIndex((p) => p.id === id);
      if (startIdx !== -1 && endIdx !== -1) {
        const [minIdx, maxIdx] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
        const rangeIds = currentPhotos.slice(minIdx, maxIdx + 1).map((p) => p.id);
        setSelectedPhotoIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
        lastSelectedPhotoIdRef.current = id;
        return;
      }
    }
    lastSelectedPhotoIdRef.current = id;
    setSelectedPhotoIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    lastSelectedPhotoIdRef.current = null;
    if (selectedPhotoIds.length === currentPhotos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(currentPhotos.map((p) => p.id));
    }
  };

  // ---------------- ANNOUNCEMENTS CRUD & REORDER ----------------
  const handleAnnouncementSaved = (saved: Announcement, isEdit: boolean) => {
    if (isEdit) {
      setAnnouncements((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
      showToast('บันทึกการแก้ไขประกาศเรียบร้อยแล้ว!');
    } else {
      setAnnouncements((prev) => [saved, ...prev]);
      showToast('เพิ่มประกาศข่าวสารเรียบร้อยแล้ว!');
    }
    setIsAnnModalOpen(false);
    setEditingAnnouncement(null);
    router.refresh();
  };

  const handleToggleAnnouncementActive = async (ann: Announcement) => {
    const nextActive = ann.isActive === 1 ? false : true;
    try {
      const res = await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ann.id, isActive: nextActive }),
      });
      const data = await res.json();
      if (data.success && data.announcement) {
        setAnnouncements((prev) => prev.map((a) => (a.id === ann.id ? data.announcement : a)));
        showToast(nextActive ? 'เปิดแสดงประกาศบนหน้าเว็บแล้ว' : 'ซ่อนประกาศชั่วคราวแล้ว');
        router.refresh();
      }
    } catch {
      showToast('เปลี่ยนสถานะไม่สำเร็จ', 'error');
    }
  };

  const persistAnnouncementOrder = async (nextList: Announcement[]) => {
    const normalized = nextList.map((a, idx) => ({ ...a, sortOrder: idx + 1 }));
    setAnnouncements(normalized);
    setReorderStatus(`จัดเรียงประกาศแล้ว (${normalized.length} รายการ)`);
    try {
      const res = await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: normalized.map((a) => a.id) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('บันทึกลำดับประกาศเรียบร้อยแล้ว!');
        router.refresh();
      }
    } catch {
      showToast('บันทึกลำดับประกาศไม่สำเร็จ', 'error');
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
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        showToast('ลบประกาศเรียบร้อยแล้ว');
        router.refresh();
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบ', 'error');
    }
  };

  // ---------------- FAQ CRUD & REORDER ----------------
  const handleSaveFaq = async (values: { question: string; answer: string; sortOrder: number }) => {
    if (editingFaq) {
      try {
        const res = await fetch('/api/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingFaq.id,
            question: values.question,
            answer: values.answer,
            sortOrder: values.sortOrder,
          }),
        });
        const data = await res.json();
        if (data.success && data.faq) {
          setFaqs((prev) => prev.map((f) => (f.id === editingFaq.id ? data.faq : f)));
          setIsFaqModalOpen(false);
          setEditingFaq(null);
          showToast('บันทึกคำถาม FAQ เรียบร้อยแล้ว');
          router.refresh();
        }
      } catch {
        showToast('เกิดข้อผิดพลาดในการแก้ไข FAQ', 'error');
      }
    } else {
      try {
        const res = await fetch('/api/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (data.success && data.faq) {
          setFaqs((prev) => [...prev, data.faq]);
          setIsFaqModalOpen(false);
          showToast('เพิ่มคำถาม FAQ ใหม่เรียบร้อยแล้ว');
          router.refresh();
        }
      } catch {
        showToast('เกิดข้อผิดพลาดในการเพิ่ม FAQ', 'error');
      }
    }
  };

  const persistFaqOrder = async (nextList: FaqItem[]) => {
    const normalized = nextList.map((f, idx) => ({ ...f, sortOrder: idx + 1 }));
    setFaqs(normalized);
    setReorderStatus(`จัดเรียงคำถาม FAQ แล้ว (${normalized.length} ข้อ)`);
    try {
      const res = await fetch('/api/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: normalized.map((f) => f.id) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('บันทึกลำดับ FAQ เรียบร้อยแล้ว!');
        router.refresh();
      }
    } catch {
      showToast('บันทึกลำดับ FAQ ไม่สำเร็จ', 'error');
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
        setFaqs((prev) => prev.filter((f) => f.id !== id));
        showToast('ลบคำถามเรียบร้อยแล้ว');
        router.refresh();
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการลบคำถาม', 'error');
    }
  };

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);

  return (
    <div className="min-h-screen bg-[#0b0a0d] text-stone-100 flex flex-col selection:bg-amber-500 selection:text-stone-950">
      {/* Single polite live region for reorder announcements */}
      <p role="status" className="sr-only">
        {reorderStatus}
      </p>

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
      <header className="sticky top-0 z-40 border-b border-amber-500/15 bg-[#0b0a0d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-rose-500/20 border border-amber-500/30 p-1 shadow-md shadow-orange-500/15">
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
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'albums'
                ? 'border-amber-400 text-white font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderPlus className="h-4 w-4 text-amber-400" />
            <span>1. แคตตาล็อก ({albums.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('photos');
              if (selectedAlbumId) loadAlbumPhotos(selectedAlbumId);
            }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'photos'
                ? 'border-amber-400 text-white font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UploadCloud className="h-4 w-4 text-emerald-400" />
            <span>2. อัปโหลด & เรียงรูป</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'announcements'
                ? 'border-amber-400 text-white font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Megaphone className="h-4 w-4 text-amber-400" />
            <span>3. ข่าวสาร & ประกาศสตูดิโอ ({announcements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faqs')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'faqs'
                ? 'border-amber-400 text-white font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HelpCircle className="h-4 w-4 text-sky-400" />
            <span>4. FAQ ({faqs.length})</span>
          </button>
        </div>

        {/* TAB 1: ALBUM MANAGEMENT WITH DRAG-AND-DROP REORDER */}
        {activeTab === 'albums' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-normal text-white">
                  จัดการแคตตาล็อกสไตล์ภาพ ({albums.length} อัลบั้ม)
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  ใช้เมาส์ลากแถบ <span className="text-amber-300">⠿ ลากเพื่อย้ายลำดับ</span> หรือกดปุ่มลูกศรเพื่อเรียงอันดับ (อันดับ #1–#3 จะโชว์บนหน้าแรกอัตโนมัติ)
                  {isSavingAlbumOrder && <span className="ml-2 text-amber-300">· กำลังบันทึกลำดับ...</span>}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingAlbum(null);
                  setIsAlbumModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-black font-semibold hover:bg-zinc-200 transition-colors shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>สร้างอัลบั้มใหม่</span>
              </button>
            </div>

            {/* Albums Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album, idx) => {
                const isDragging = draggingAlbumId === album.id;
                const isDropTarget = dragOverAlbumId === album.id && draggingAlbumId !== album.id;
                const dragKey = `album:${album.id}`;

                return (
                  <div
                    key={album.id}
                    draggable={armedDragKey === dragKey || draggingAlbumId === album.id}
                    onDragStart={(e) => {
                      if (armedDragKey !== dragKey) {
                        e.preventDefault();
                        return;
                      }
                      setDraggingAlbumId(album.id);
                      setRootDragging(true);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', album.id);
                    }}
                    onDragOver={(e) => {
                      if (!draggingAlbumId) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverAlbumId !== album.id) {
                        setDragOverAlbumId(album.id);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const sourceId = draggingAlbumId || e.dataTransfer.getData('text/plain');
                      const fromIndex = albums.findIndex((a) => a.id === sourceId);
                      const toIndex = idx;
                      setDraggingAlbumId(null);
                      setDragOverAlbumId(null);
                      setArmedDragKey(null);
                      setRootDragging(false);
                      if (fromIndex !== -1 && fromIndex !== toIndex) {
                        handleMoveAlbumIndex(fromIndex, toIndex);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggingAlbumId(null);
                      setDragOverAlbumId(null);
                      setArmedDragKey(null);
                      setRootDragging(false);
                    }}
                    className={`flex flex-col rounded-2xl glass-panel overflow-hidden shadow-xl transition-all ${
                      isDragging
                        ? 'opacity-50 scale-[0.98] border-amber-400/60'
                        : isDropTarget
                          ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-500/10'
                          : 'border border-white/[0.08]'
                    }`}
                  >
                    {/* Dedicated Drag Handle + Quick Reorder Bar */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-zinc-950/90 border-b border-white/[0.07]">
                      <div
                        className="drag-handle flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-mono text-zinc-300 hover:bg-white/10 hover:text-amber-300 transition-colors"
                        onPointerDown={() => setArmedDragKey(dragKey)}
                        title="กดค้างแล้วลากเพื่อย้ายตำแหน่งอัลบั้มนี้"
                      >
                        <GripVertical className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>ลากย้าย · #{idx + 1}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {idx < 3 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/35 px-2 py-0.5 text-[10px] font-mono text-amber-300 mr-1">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            <span>หน้าแรก</span>
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveAlbumIndex(idx, 0)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-zinc-300 hover:bg-amber-500/20 hover:text-amber-200 disabled:opacity-30"
                          title="ดันขึ้นอันดับ #1 บนสุด"
                        >
                          <ArrowUpToLine className="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveAlbumIndex(idx, idx - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/15 disabled:opacity-30"
                          title="เลื่อนขึ้น 1 อันดับ"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === albums.length - 1}
                          onClick={() => handleMoveAlbumIndex(idx, idx + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/15 disabled:opacity-30"
                          title="เลื่อนลง 1 อันดับ"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Real 4-Photo Cover Grid Preview */}
                    <div className="relative">
                      <AlbumCoverGrid
                        previewPhotos={album.previewPhotos}
                        coverImage={album.coverImage}
                        title={album.title}
                        photoCount={album.photoCount || 0}
                      />

                      {album.isPrivate === 1 && (
                        <span
                          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-rose-950/90 border border-rose-500/40 px-2.5 py-1 text-[10px] font-mono text-rose-200 shadow"
                          title={album.passcode ? `รหัสผ่าน: ${album.passcode}` : 'อัลบั้มส่วนตัว'}
                        >
                          <Lock className="h-3 w-3" />
                          <span>ส่วนตัว{album.passcode ? ` · ${album.passcode}` : ''}</span>
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-serif text-lg font-medium text-white line-clamp-1">
                          {album.title}
                        </h3>
                        {album.description ? (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 whitespace-pre-line font-light leading-relaxed">
                            {album.description}
                          </p>
                        ) : (
                          <p className="text-[11px] text-zinc-600 mt-1 italic font-mono">
                            (ยังไม่มีคำอธิบาย)
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 pt-4 border-t border-white/[0.07]">
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
                          onClick={() => {
                            setEditingAlbum(album);
                            setIsAlbumModalOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-200"
                          title="แก้ไขชื่อ / คำอธิบาย / รหัสผ่าน"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyAlbumLink(album.slug, album.title)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white"
                          title="คัดลอกลิงก์อัลบั้ม"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        <Link
                          href={`/album/${album.slug}`}
                          target="_blank"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white"
                          title="เปิดดูหน้าอัลบั้มเต็ม"
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

        {/* TAB 2: PHOTOS & FILE MANAGER (WITH CLIPBOARD PASTE, SHIFT-SELECT & DND REORDER) */}
        {activeTab === 'photos' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl glass-panel p-5">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Layers className="h-5 w-5 text-amber-400 shrink-0" />
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
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAlbum(selectedAlbum);
                      setIsAlbumModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 px-3 py-2 text-xs font-mono text-zinc-200 transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>แก้ไขคำอธิบาย</span>
                  </button>

                  <Link
                    href={`/album/${selectedAlbum.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 text-xs font-mono text-amber-300 hover:bg-amber-500/30 transition-all font-semibold"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>เปิดดูหน้าอัลบั้มเต็ม</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </div>
              )}
            </div>

            {/* Drag & Drop + Paste Upload Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelected(e.dataTransfer.files);
              }}
              className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-zinc-950/40 p-8 sm:p-10 text-center hover:border-amber-500/40 hover:bg-zinc-950/60 transition-all cursor-pointer"
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
                ลากและวางรูปภาพที่นี่ · คลิกเลือกไฟล์ · หรือกด Ctrl+V วางรูปจากคลิปบอร์ด
              </h3>
              <p className="mt-1 text-xs font-mono text-zinc-400 max-w-md font-light">
                ระบบจะอัปโหลดขึ้น Cloudinary และสร้าง Thumbnail + Blur Preview ให้ทันทีอัตโนมัติค่ะ
              </p>

              <button
                type="button"
                className="mt-5 rounded-full bg-white/10 hover:bg-white/20 px-5 py-2 text-xs font-mono text-white transition-colors border border-white/10"
              >
                เลือกรูปภาพจากเครื่อง
              </button>
            </div>

            {/* STAGED PHOTOS TRAY */}
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
                      {(stagedPhotos.reduce((acc, curr) => acc + curr.size, 0) / 1024 / 1024).toFixed(2)}{' '}
                      MB
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
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-50 px-5 py-2 text-xs font-mono uppercase tracking-wider text-white font-bold transition-all shadow-lg shadow-orange-500/25"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{isUploading ? 'กำลังอัปโหลด...' : `เริ่มอัปโหลด (${stagedPhotos.length} รูป)`}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-80 overflow-y-auto pr-1">
                  {stagedPhotos.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl overflow-hidden border border-white/10 bg-zinc-950/80 shadow-md"
                    >
                      <div className="relative aspect-square w-full">
                        <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-transparent transition-colors" />

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

                      <div className="p-2 text-[10px] font-mono text-zinc-400 truncate">
                        <p className="truncate text-zinc-200" title={item.file.name}>
                          {item.file.name}
                        </p>
                        <span className="text-zinc-500">{(item.size / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BATCH ACTIONS TOOLBAR */}
            <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl p-4 shadow-2xl">
              <div className="flex flex-wrap items-center gap-3">
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
                  เลือกอยู่ <span className="text-white font-bold">{selectedPhotoIds.length}</span> จาก{' '}
                  {currentPhotos.length} รูป · <span className="text-zinc-500">กด Shift+คลิก เลือกเป็นช่วง · ลากแถบ ⠿ เรียงลำดับรูปได้</span>
                </span>
              </div>

              {selectedPhotoIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 animate-fade-in">
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

            {/* Photos Grid with Reorder Drag Handles */}
            {isLoadingPhotos ? (
              <div className="py-20 text-center font-mono text-xs text-zinc-500">กำลังโหลดรูปภาพ...</div>
            ) : currentPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-16 text-center">
                <ImageIcon className="h-10 w-10 text-zinc-600 mb-3" />
                <p className="text-sm font-mono text-zinc-400">
                  ยังไม่มีรูปภาพในอัลบั้มนี้ ลากไฟล์ใส่ด้านบน หรือกด Ctrl+V วางรูปได้เลยค่ะ
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {currentPhotos.map((photo, index) => {
                  const isSelected = selectedPhotoIds.includes(photo.id);
                  const isCover = selectedAlbum?.coverImage === photo.thumbUrl;
                  const isDragging = draggingPhotoId === photo.id;
                  const isDropTarget = dragOverPhotoId === photo.id && draggingPhotoId !== photo.id;
                  const photoDragKey = `photo:${photo.id}`;

                  return (
                    <div
                      key={photo.id}
                      draggable={armedDragKey === photoDragKey || draggingPhotoId === photo.id}
                      onDragStart={(e) => {
                        if (armedDragKey !== photoDragKey) {
                          e.preventDefault();
                          return;
                        }
                        setDraggingPhotoId(photo.id);
                        setRootDragging(true);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', photo.id);
                      }}
                      onDragOver={(e) => {
                        if (!draggingPhotoId) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverPhotoId !== photo.id) setDragOverPhotoId(photo.id);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceId = draggingPhotoId || e.dataTransfer.getData('text/plain');
                        const fromIndex = currentPhotos.findIndex((p) => p.id === sourceId);
                        setDraggingPhotoId(null);
                        setDragOverPhotoId(null);
                        setArmedDragKey(null);
                        setRootDragging(false);
                        if (fromIndex !== -1 && fromIndex !== index) {
                          handleMovePhotoIndex(fromIndex, index);
                        }
                      }}
                      onDragEnd={() => {
                        setDraggingPhotoId(null);
                        setDragOverPhotoId(null);
                        setArmedDragKey(null);
                        setRootDragging(false);
                      }}
                      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all ${
                        isDragging
                          ? 'opacity-50 scale-[0.98] border-amber-400'
                          : isDropTarget
                            ? 'ring-2 ring-amber-400 border-amber-400'
                            : isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20'
                              : 'border-white/[0.08] bg-zinc-950 hover:border-white/20'
                      }`}
                    >
                      {/* Top Reorder Handle & Left/Right Arrows */}
                      <div className="flex items-center justify-between px-2 py-1 bg-zinc-900/90 border-b border-white/[0.06]">
                        <div
                          className="drag-handle flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-amber-300"
                          onPointerDown={() => setArmedDragKey(photoDragKey)}
                          title="ลากเพื่อจัดลำดับรูปภาพ"
                        >
                          <GripVertical className="h-3.5 w-3.5 text-amber-400" />
                          <span>#{index + 1}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMovePhotoIndex(index, 0)}
                            className="p-0.5 text-zinc-400 hover:text-amber-300 disabled:opacity-25"
                            title="ย้ายไปรูปแรกสุด"
                          >
                            <ArrowUpToLine className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMovePhotoIndex(index, index - 1)}
                            className="p-0.5 text-zinc-400 hover:text-white disabled:opacity-25"
                            title="เลื่อนไปก่อนหน้า"
                          >
                            <ArrowLeft className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === currentPhotos.length - 1}
                            onClick={() => handleMovePhotoIndex(index, index + 1)}
                            className="p-0.5 text-zinc-400 hover:text-white disabled:opacity-25"
                            title="เลื่อนไปถัดไป"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

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

                        {/* Selection Checkbox (supports Shift+Click range) */}
                        <div
                          className="absolute top-2 left-2 z-10 cursor-pointer"
                          onClick={(e) => toggleSelectPhoto(photo.id, e.shiftKey)}
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

                        {/* Cover / Top-4 Quad Preview Badges */}
                        <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1 pointer-events-none">
                          {isCover && (
                            <span className="rounded bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-mono font-bold text-black shadow">
                              ★ ปกหลัก
                            </span>
                          )}
                          {index < 4 && (
                            <span className="rounded bg-black/75 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-mono text-amber-200">
                              ปกช่อง {index + 1}
                            </span>
                          )}
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
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/70 hover:bg-black text-zinc-300 hover:text-amber-300"
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

                      <div className="p-2.5 bg-zinc-950 text-[10px] font-mono text-zinc-400 space-y-0.5">
                        <p className="truncate text-zinc-200" title={photo.originalName}>
                          {photo.originalName}
                        </p>
                        <div className="flex justify-between text-zinc-500">
                          <span>
                            {photo.width}×{photo.height}
                          </span>
                          <span>{(photo.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Lightbox
              photos={currentPhotos}
              currentIndex={activePhotoIndex}
              isOpen={adminLightboxOpen}
              onClose={() => setAdminLightboxOpen(false)}
              onNavigate={(newIndex) => setActivePhotoIndex(newIndex)}
            />
          </div>
        )}

        {/* TAB 3: STUDIO NEWS & ANNOUNCEMENTS (CREATE, EDIT, IMAGE+TEXT, TOGGLE, REORDER) */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-normal text-white">
                  ข่าวสารและประกาศจากสตูดิโอ ({announcements.length} รายการ)
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  เพิ่ม แก้ไข หรือซ่อนข่าวสาร/ประกาศหน้าแรกได้ครบทั้งแบบตัวหนังสืออย่างเดียว รูปภาพอย่างเดียว หรือใส่ทั้งคู่พร้อมกันค่ะ
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingAnnouncement(null);
                  setIsAnnModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-black font-semibold hover:bg-zinc-200 transition-colors shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>เพิ่มประกาศใหม่</span>
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-14 text-center text-xs font-mono text-zinc-400">
                ยังไม่มีประกาศข่าวสาร กดปุ่ม &ldquo;เพิ่มประกาศใหม่&rdquo; ด้านบนเพื่อแสดงบนหน้าแรกได้เลยค่ะ
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.map((ann, idx) => {
                  const isActive = ann.isActive !== 0;
                  const isDragging = draggingAnnId === ann.id;
                  const isDropTarget = dragOverAnnId === ann.id && draggingAnnId !== ann.id;
                  const annDragKey = `ann:${ann.id}`;

                  return (
                    <div
                      key={ann.id}
                      draggable={armedDragKey === annDragKey || draggingAnnId === ann.id}
                      onDragStart={(e) => {
                        if (armedDragKey !== annDragKey) {
                          e.preventDefault();
                          return;
                        }
                        setDraggingAnnId(ann.id);
                        setRootDragging(true);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', ann.id);
                      }}
                      onDragOver={(e) => {
                        if (!draggingAnnId) return;
                        e.preventDefault();
                        if (dragOverAnnId !== ann.id) setDragOverAnnId(ann.id);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceId = draggingAnnId || e.dataTransfer.getData('text/plain');
                        const fromIndex = announcements.findIndex((a) => a.id === sourceId);
                        setDraggingAnnId(null);
                        setDragOverAnnId(null);
                        setArmedDragKey(null);
                        setRootDragging(false);
                        if (fromIndex !== -1 && fromIndex !== idx) {
                          persistAnnouncementOrder(arrayMove(announcements, fromIndex, idx));
                        }
                      }}
                      onDragEnd={() => {
                        setDraggingAnnId(null);
                        setDragOverAnnId(null);
                        setArmedDragKey(null);
                        setRootDragging(false);
                      }}
                      className={`rounded-2xl glass-panel overflow-hidden shadow-xl flex flex-col justify-between transition-all ${
                        isDragging
                          ? 'opacity-50 scale-[0.98]'
                          : isDropTarget
                            ? 'ring-2 ring-amber-400 border-amber-400'
                            : isActive
                              ? 'border border-white/10'
                              : 'border border-white/5 opacity-65'
                      }`}
                    >
                      {/* Top Header: Drag Handle, Status Toggle, Move Arrows */}
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-zinc-950/90 border-b border-white/[0.07]">
                        <div className="flex items-center gap-2">
                          <div
                            className="drag-handle flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-amber-300"
                            onPointerDown={() => setArmedDragKey(annDragKey)}
                            title="ลากเพื่อจัดลำดับประกาศ"
                          >
                            <GripVertical className="h-4 w-4 text-amber-400" />
                            <span>#{idx + 1}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleAnnouncementActive(ann)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono border transition-colors ${
                              isActive
                                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25'
                                : 'bg-zinc-800 border-white/15 text-zinc-400 hover:text-white'
                            }`}
                            title="คลิกเพื่อเปิด/ซ่อนประกาศนี้บนหน้าแรก"
                          >
                            {isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            <span>{isActive ? 'แสดงหน้าเว็บ' : 'ซ่อนอยู่'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => persistAnnouncementOrder(arrayMove(announcements, idx, idx - 1))}
                            className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/15 disabled:opacity-30"
                            title="เลื่อนขึ้น"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === announcements.length - 1}
                            onClick={() => persistAnnouncementOrder(arrayMove(announcements, idx, idx + 1))}
                            className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/15 disabled:opacity-30"
                            title="เลื่อนลง"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {ann.imageUrl && (
                        <div className="bg-zinc-950/80 border-b border-white/5 p-2 flex items-center justify-center">
                          <img
                            src={ann.imageUrl}
                            alt={ann.title || 'ภาพประกาศ'}
                            className="max-h-56 w-auto object-contain rounded"
                          />
                        </div>
                      )}

                      <div className="p-5 flex flex-col justify-between gap-4 flex-1">
                        <div className="space-y-2">
                          {ann.title?.trim() ? (
                            <h4 className="font-serif text-base font-medium text-white">{ann.title}</h4>
                          ) : (
                            <span className="inline-block text-[10px] font-mono text-zinc-500">
                              (ประกาศแบบไม่มีหัวข้อ)
                            </span>
                          )}
                          {ann.content && (
                            <p className="text-xs text-zinc-300 font-light whitespace-pre-line leading-relaxed">
                              {ann.content}
                            </p>
                          )}
                          {ann.linkUrl && (
                            <a
                              href={ann.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block text-[11px] font-mono text-amber-400 hover:underline truncate max-w-full"
                            >
                              🔗 {ann.linkUrl}
                            </a>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.07]">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAnnouncement(ann);
                              setIsAnnModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 hover:bg-amber-500/20 hover:border-amber-400/40 px-3 py-1.5 text-xs font-mono text-white transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-amber-300" />
                            <span>แก้ไข (ข้อความ/ภาพ)</span>
                          </button>

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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FAQ MANAGER WITH DRAG-AND-DROP & ARROWS */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-normal text-white">
                  จัดการคำถามที่พบบ่อย (FAQs) ({faqs.length} คำถาม)
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  ลากแถบ ⠿ หรือกดลูกศร ↑ ↓ เพื่อสลับลำดับคำถามที่หน้าแรกได้เลยค่ะ
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingFaq(null);
                  setIsFaqModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-black font-semibold hover:bg-zinc-200 transition-colors shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>เพิ่มคำถามใหม่</span>
              </button>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isDragging = draggingFaqId === faq.id;
                const isDropTarget = dragOverFaqId === faq.id && draggingFaqId !== faq.id;
                const faqDragKey = `faq:${faq.id}`;

                return (
                  <div
                    key={faq.id}
                    draggable={armedDragKey === faqDragKey || draggingFaqId === faq.id}
                    onDragStart={(e) => {
                      if (armedDragKey !== faqDragKey) {
                        e.preventDefault();
                        return;
                      }
                      setDraggingFaqId(faq.id);
                      setRootDragging(true);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', faq.id);
                    }}
                    onDragOver={(e) => {
                      if (!draggingFaqId) return;
                      e.preventDefault();
                      if (dragOverFaqId !== faq.id) setDragOverFaqId(faq.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const sourceId = draggingFaqId || e.dataTransfer.getData('text/plain');
                      const fromIndex = faqs.findIndex((f) => f.id === sourceId);
                      setDraggingFaqId(null);
                      setDragOverFaqId(null);
                      setArmedDragKey(null);
                      setRootDragging(false);
                      if (fromIndex !== -1 && fromIndex !== idx) {
                        persistFaqOrder(arrayMove(faqs, fromIndex, idx));
                      }
                    }}
                    onDragEnd={() => {
                      setDraggingFaqId(null);
                      setDragOverFaqId(null);
                      setArmedDragKey(null);
                      setRootDragging(false);
                    }}
                    className={`rounded-xl glass-panel p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                      isDragging
                        ? 'opacity-50 scale-[0.99]'
                        : isDropTarget
                          ? 'ring-2 ring-amber-400 border-amber-400'
                          : 'border border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="drag-handle mt-1 flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/25 px-2 py-1 text-[10px] font-mono text-amber-300 shrink-0"
                        onPointerDown={() => setArmedDragKey(faqDragKey)}
                        title="ลากเพื่อจัดลำดับ"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                        <span>#{idx + 1}</span>
                      </div>

                      <div className="space-y-1 flex-1">
                        <h4 className="font-serif text-base font-medium text-white">{faq.question}</h4>
                        <p className="text-xs sm:text-sm text-zinc-400 font-light whitespace-pre-line leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => persistFaqOrder(arrayMove(faqs, idx, idx - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/15 disabled:opacity-30"
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === faqs.length - 1}
                        onClick={() => persistFaqOrder(arrayMove(faqs, idx, idx + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/15 disabled:opacity-30"
                        title="เลื่อนลง"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingFaq(faq);
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
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AlbumFormModal
        isOpen={isAlbumModalOpen}
        editingAlbum={editingAlbum}
        onClose={() => {
          setIsAlbumModalOpen(false);
          setEditingAlbum(null);
        }}
        onSubmit={handleSaveAlbumModal}
      />

      <AnnouncementModal
        isOpen={isAnnModalOpen}
        editingAnnouncement={editingAnnouncement}
        onClose={() => {
          setIsAnnModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSaved={handleAnnouncementSaved}
        onError={(msg) => showToast(msg, 'error')}
      />

      <FaqModal
        isOpen={isFaqModalOpen}
        editingFaq={editingFaq}
        defaultSortOrder={faqs.length + 1}
        onClose={() => {
          setIsFaqModalOpen(false);
          setEditingFaq(null);
        }}
        onSave={handleSaveFaq}
      />
    </div>
  );
}
