import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'gallery.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for high performance concurrent reading/writing
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    clientName TEXT,
    eventDate TEXT,
    coverImage TEXT,
    isPrivate INTEGER DEFAULT 0,
    passcode TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    albumId TEXT NOT NULL,
    originalName TEXT NOT NULL,
    filename TEXT NOT NULL,
    originalUrl TEXT NOT NULL,
    previewUrl TEXT NOT NULL,
    thumbUrl TEXT NOT NULL,
    blurDataUrl TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    fileSize INTEGER NOT NULL,
    sortOrder INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (albumId) REFERENCES albums(id) ON DELETE CASCADE
  );
`);

export interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  clientName: string | null;
  eventDate: string | null;
  coverImage: string | null;
  isPrivate: number;
  passcode: string | null;
  createdAt: string;
  updatedAt: string;
  photoCount?: number;
}

export interface Photo {
  id: string;
  albumId: string;
  originalName: string;
  filename: string;
  originalUrl: string;
  previewUrl: string;
  thumbUrl: string;
  blurDataUrl: string;
  width: number;
  height: number;
  fileSize: number;
  sortOrder: number;
  createdAt: string;
}

// Albums DB Queries
export function getAllAlbums(): Album[] {
  const stmt = db.prepare(`
    SELECT a.*, COUNT(p.id) as photoCount
    FROM albums a
    LEFT JOIN photos p ON a.id = p.albumId
    GROUP BY a.id
    ORDER BY a.createdAt DESC
  `);
  return stmt.all() as Album[];
}

export function getAlbumBySlug(slug: string): (Album & { photos: Photo[] }) | null {
  const albumStmt = db.prepare(`SELECT * FROM albums WHERE slug = ?`);
  const album = albumStmt.get(slug) as Album | undefined;
  if (!album) return null;

  const photosStmt = db.prepare(`SELECT * FROM photos WHERE albumId = ? ORDER BY sortOrder ASC, createdAt DESC`);
  const photos = photosStmt.all(album.id) as Photo[];

  return { ...album, photos };
}

export function getAlbumById(id: string): (Album & { photos: Photo[] }) | null {
  const albumStmt = db.prepare(`SELECT * FROM albums WHERE id = ?`);
  const album = albumStmt.get(id) as Album | undefined;
  if (!album) return null;

  const photosStmt = db.prepare(`SELECT * FROM photos WHERE albumId = ? ORDER BY sortOrder ASC, createdAt DESC`);
  const photos = photosStmt.all(id) as Photo[];

  return { ...album, photos };
}

export function createAlbum(data: {
  title: string;
  slug?: string;
  description?: string;
  clientName?: string;
  eventDate?: string;
  isPrivate?: boolean;
  passcode?: string;
}): Album {
  const id = 'alb_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const now = new Date().toISOString();
  const slug = (data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) + '-' + Math.random().toString(36).substring(2, 6);

  const stmt = db.prepare(`
    INSERT INTO albums (id, title, slug, description, clientName, eventDate, isPrivate, passcode, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.title,
    slug,
    data.description || null,
    data.clientName || null,
    data.eventDate || now.split('T')[0],
    data.isPrivate ? 1 : 0,
    data.passcode || null,
    now,
    now
  );

  return getAlbumById(id)!;
}

export function updateAlbum(id: string, data: Partial<Album>): Album | null {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['title', 'description', 'clientName', 'eventDate', 'coverImage', 'isPrivate', 'passcode'];
  for (const key of allowedFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push((data as any)[key]);
    }
  }

  if (fields.length === 0) return getAlbumById(id);

  fields.push(`updatedAt = ?`);
  values.push(now);
  values.push(id);

  const stmt = db.prepare(`UPDATE albums SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getAlbumById(id);
}

export function deleteAlbum(id: string): boolean {
  // First fetch photos to clean up files if needed
  const photosStmt = db.prepare(`SELECT * FROM photos WHERE albumId = ?`);
  const photos = photosStmt.all(id) as Photo[];

  for (const photo of photos) {
    try {
      const origPath = path.join(process.cwd(), 'public', photo.originalUrl);
      const prevPath = path.join(process.cwd(), 'public', photo.previewUrl);
      const thumbPath = path.join(process.cwd(), 'public', photo.thumbUrl);
      if (fs.existsSync(origPath)) fs.unlinkSync(origPath);
      if (fs.existsSync(prevPath)) fs.unlinkSync(prevPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    } catch {
      // Ignore file unlink error
    }
  }

  const stmt = db.prepare(`DELETE FROM albums WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

// Photos DB Queries
export function createPhoto(data: {
  albumId: string;
  originalName: string;
  filename: string;
  originalUrl: string;
  previewUrl: string;
  thumbUrl: string;
  blurDataUrl: string;
  width: number;
  height: number;
  fileSize: number;
}): Photo {
  const id = 'pho_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO photos (id, albumId, originalName, filename, originalUrl, previewUrl, thumbUrl, blurDataUrl, width, height, fileSize, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.albumId,
    data.originalName,
    data.filename,
    data.originalUrl,
    data.previewUrl,
    data.thumbUrl,
    data.blurDataUrl,
    data.width,
    data.height,
    data.fileSize,
    now
  );

  // If album doesn't have a cover photo yet, set this one as cover
  const album = db.prepare(`SELECT coverImage FROM albums WHERE id = ?`).get(data.albumId) as { coverImage: string | null } | undefined;
  if (album && !album.coverImage) {
    db.prepare(`UPDATE albums SET coverImage = ? WHERE id = ?`).run(data.thumbUrl, data.albumId);
  }

  return db.prepare(`SELECT * FROM photos WHERE id = ?`).get(id) as Photo;
}

export function movePhotos(photoIds: string[], targetAlbumId: string): number {
  if (!photoIds.length) return 0;
  const placeholders = photoIds.map(() => '?').join(',');
  const stmt = db.prepare(`UPDATE photos SET albumId = ? WHERE id IN (${placeholders})`);
  const result = stmt.run(targetAlbumId, ...photoIds);

  // Check target album cover
  const targetAlbum = db.prepare(`SELECT coverImage FROM albums WHERE id = ?`).get(targetAlbumId) as { coverImage: string | null } | undefined;
  if (targetAlbum && !targetAlbum.coverImage) {
    const firstPhoto = db.prepare(`SELECT thumbUrl FROM photos WHERE albumId = ? LIMIT 1`).get(targetAlbumId) as { thumbUrl: string } | undefined;
    if (firstPhoto) {
      db.prepare(`UPDATE albums SET coverImage = ? WHERE id = ?`).run(firstPhoto.thumbUrl, targetAlbumId);
    }
  }

  return result.changes;
}

export function deletePhotos(photoIds: string[]): number {
  if (!photoIds.length) return 0;
  const placeholders = photoIds.map(() => '?').join(',');
  const photos = db.prepare(`SELECT * FROM photos WHERE id IN (${placeholders})`).all(...photoIds) as Photo[];

  for (const photo of photos) {
    try {
      const origPath = path.join(process.cwd(), 'public', photo.originalUrl);
      const prevPath = path.join(process.cwd(), 'public', photo.previewUrl);
      const thumbPath = path.join(process.cwd(), 'public', photo.thumbUrl);
      if (fs.existsSync(origPath)) fs.unlinkSync(origPath);
      if (fs.existsSync(prevPath)) fs.unlinkSync(prevPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    } catch {
      // Ignore cleanup error
    }
  }

  const stmt = db.prepare(`DELETE FROM photos WHERE id IN (${placeholders})`);
  const result = stmt.run(...photoIds);
  return result.changes;
}

export function setAlbumCover(albumId: string, photoThumbUrl: string): boolean {
  const stmt = db.prepare(`UPDATE albums SET coverImage = ? WHERE id = ?`);
  const result = stmt.run(photoThumbUrl, albumId);
  return result.changes > 0;
}

// Initial Seeder for Demo Content
export function seedSampleData() {
  const count = db.prepare(`SELECT COUNT(*) as count FROM albums`).get() as { count: number };
  if (count.count > 0) return;

  const now = new Date().toISOString();

  // Create Sample Album 1: Editorial & Fashion
  const alb1Id = 'alb_sample_editorial';
  db.prepare(`
    INSERT INTO albums (id, title, slug, description, clientName, eventDate, coverImage, isPrivate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    alb1Id,
    'Sartorial Elegance — Autumn / Winter',
    'sartorial-elegance-aw',
    'Haute couture editorial campaign captured with natural softbox illumination and minimalist styling.',
    'Maison Studio Bangkok',
    '2026-09-18',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    now,
    now
  );

  // Sample Photos for Album 1
  const photos1 = [
    {
      id: 'pho_s1_1',
      title: 'Vogue Light Study I',
      url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=85',
      thumb: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=75',
      width: 1200,
      height: 1600,
    },
    {
      id: 'pho_s1_2',
      title: 'Minimalist Portrait',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=85',
      thumb: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=75',
      width: 1200,
      height: 1500,
    },
    {
      id: 'pho_s1_3',
      title: 'Modern Architecture Silhouette',
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=85',
      thumb: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=75',
      width: 1600,
      height: 1067,
    },
    {
      id: 'pho_s1_4',
      title: 'Monochrome Texture',
      url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85',
      thumb: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=75',
      width: 1200,
      height: 1600,
    },
    {
      id: 'pho_s1_5',
      title: 'Studio Shadows',
      url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=85',
      thumb: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=75',
      width: 1600,
      height: 1067,
    }
  ];

  for (const p of photos1) {
    db.prepare(`
      INSERT INTO photos (id, albumId, originalName, filename, originalUrl, previewUrl, thumbUrl, blurDataUrl, width, height, fileSize, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.id,
      alb1Id,
      p.title + '.jpg',
      p.id + '.jpg',
      p.url,
      p.url,
      p.thumb,
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWUxZTFlIi8+PC9zdmc+',
      p.width,
      p.height,
      450000,
      now
    );
  }

  // Create Sample Album 2: Architectural Spaces
  const alb2Id = 'alb_sample_architecture';
  db.prepare(`
    INSERT INTO albums (id, title, slug, description, clientName, eventDate, coverImage, isPrivate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    alb2Id,
    'Brutalist Sanctuary & Light',
    'brutalist-sanctuary',
    'Geometric form and architectural stillness exploring concrete textures and shadows.',
    'Forma Architecture Lab',
    '2026-09-25',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    now,
    now
  );

  const photos2 = [
    {
      id: 'pho_s2_1',
      title: 'Minimalist Interior Vista',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
      thumb: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=75',
      width: 1600,
      height: 1067,
    },
    {
      id: 'pho_s2_2',
      title: 'Concrete Symmetry',
      url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85',
      thumb: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=75',
      width: 1600,
      height: 1067,
    },
    {
      id: 'pho_s2_3',
      title: 'Monolith Window Light',
      url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85',
      thumb: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=75',
      width: 1200,
      height: 1600,
    }
  ];

  for (const p of photos2) {
    db.prepare(`
      INSERT INTO photos (id, albumId, originalName, filename, originalUrl, previewUrl, thumbUrl, blurDataUrl, width, height, fileSize, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.id,
      alb2Id,
      p.title + '.jpg',
      p.id + '.jpg',
      p.url,
      p.url,
      p.thumb,
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWEyMDI2Ii8+PC9zdmc+',
      p.width,
      p.height,
      520000,
      now
    );
  }
}

// Automatically seed on initial launch if empty
try {
  seedSampleData();
} catch (e) {
  console.error('Seed check note:', e);
}
