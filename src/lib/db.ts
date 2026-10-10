import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'gallery.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

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
    sortOrder INTEGER DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    imageUrl TEXT,
    linkUrl TEXT,
    isActive INTEGER DEFAULT 1,
    sortOrder INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sortOrder INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );
`);

// Safe migration for sortOrder in albums
try {
  db.exec(`ALTER TABLE albums ADD COLUMN sortOrder INTEGER DEFAULT 0;`);
} catch {
  // column already exists
}

// Safe migration for content in announcements
try {
  db.exec(`ALTER TABLE announcements ADD COLUMN content TEXT;`);
} catch {
  // column already exists
}

// Safe migration to make announcements.imageUrl nullable
try {
  const annInfo = db.prepare('PRAGMA table_info(announcements)').all() as Array<{ name: string; notnull: number }>;
  const imgCol = annInfo.find((c) => c.name === 'imageUrl');
  if (imgCol && imgCol.notnull === 1) {
    db.exec(`
      CREATE TABLE announcements_temp (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        imageUrl TEXT,
        linkUrl TEXT,
        isActive INTEGER DEFAULT 1,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );
      INSERT INTO announcements_temp (id, title, content, imageUrl, linkUrl, isActive, sortOrder, createdAt)
      SELECT id, title, content, imageUrl, linkUrl, isActive, sortOrder, createdAt FROM announcements;
      DROP TABLE announcements;
      ALTER TABLE announcements_temp RENAME TO announcements;
    `);
  }
} catch {
  // ignore migration error
}

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
  sortOrder: number;
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

export interface Announcement {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: number;
  sortOrder: number;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  createdAt: string;
}

// ----------------- ALBUM QUERIES -----------------
export function getAllAlbums(): Album[] {
  const stmt = db.prepare(`
    SELECT a.*, COUNT(p.id) as photoCount
    FROM albums a
    LEFT JOIN photos p ON a.id = p.albumId
    GROUP BY a.id
    ORDER BY a.sortOrder ASC, a.createdAt DESC
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
  sortOrder?: number;
}): Album {
  const id = 'alb_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const now = new Date().toISOString();
  const slug = (data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) + '-' + Math.random().toString(36).substring(2, 6);

  const stmt = db.prepare(`
    INSERT INTO albums (id, title, slug, description, sortOrder, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.title,
    slug,
    data.description || null,
    data.sortOrder ?? 0,
    now,
    now
  );

  return getAlbumById(id)!;
}

export function updateAlbum(id: string, data: Partial<Album>): Album | null {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['title', 'description', 'sortOrder', 'coverImage'];
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

// ----------------- PHOTO QUERIES -----------------
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

// ----------------- ANNOUNCEMENT QUERIES -----------------
export function getAllAnnouncements(): Announcement[] {
  const stmt = db.prepare(`SELECT * FROM announcements ORDER BY sortOrder ASC, createdAt DESC`);
  return stmt.all() as Announcement[];
}

export function getActiveAnnouncements(): Announcement[] {
  const stmt = db.prepare(`SELECT * FROM announcements WHERE isActive = 1 ORDER BY sortOrder ASC, createdAt DESC`);
  return stmt.all() as Announcement[];
}

export function createAnnouncement(data: {
  title: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}): Announcement {
  const id = 'ann_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO announcements (id, title, content, imageUrl, linkUrl, isActive, sortOrder, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.title,
    data.content || null,
    data.imageUrl || null,
    data.linkUrl || null,
    data.isActive !== false ? 1 : 0,
    data.sortOrder ?? 0,
    now
  );

  return db.prepare(`SELECT * FROM announcements WHERE id = ?`).get(id) as Announcement;
}

export function updateAnnouncement(id: string, data: Partial<Announcement>): Announcement | null {
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['title', 'content', 'imageUrl', 'linkUrl', 'isActive', 'sortOrder'];
  for (const key of allowedFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push((data as any)[key]);
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  db.prepare(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare(`SELECT * FROM announcements WHERE id = ?`).get(id) as Announcement;
}

export function deleteAnnouncement(id: string): boolean {
  const stmt = db.prepare(`DELETE FROM announcements WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

// ----------------- FAQ QUERIES -----------------
export function getAllFaqs(): FaqItem[] {
  const stmt = db.prepare(`SELECT * FROM faqs ORDER BY sortOrder ASC, createdAt ASC`);
  return stmt.all() as FaqItem[];
}

export function createFaq(data: {
  question: string;
  answer: string;
  sortOrder?: number;
}): FaqItem {
  const id = 'faq_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO faqs (id, question, answer, sortOrder, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.question,
    data.answer,
    data.sortOrder ?? 0,
    now
  );

  return db.prepare(`SELECT * FROM faqs WHERE id = ?`).get(id) as FaqItem;
}

export function updateFaq(id: string, data: Partial<FaqItem>): FaqItem | null {
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['question', 'answer', 'sortOrder'];
  for (const key of allowedFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push((data as any)[key]);
    }
  }

  if (fields.length === 0) return null;

  values.push(id);
  db.prepare(`UPDATE faqs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare(`SELECT * FROM faqs WHERE id = ?`).get(id) as FaqItem;
}

export function deleteFaq(id: string): boolean {
  const stmt = db.prepare(`DELETE FROM faqs WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

// ----------------- SEED DATA -----------------
export function seedSampleData() {
  const albumCount = db.prepare(`SELECT COUNT(*) as count FROM albums`).get() as { count: number };
  const faqCount = db.prepare(`SELECT COUNT(*) as count FROM faqs`).get() as { count: number };
  const annCount = db.prepare(`SELECT COUNT(*) as count FROM announcements`).get() as { count: number };

  const now = new Date().toISOString();

  // Seed Announcements / News
  if (annCount.count === 0) {
    createAnnouncement({
      title: 'ยินดีต้อนรับสู่ F-Secret AI Art · สตูดิโอสร้างสรรค์ภาพ AI ระดับพรีเมียม',
      content: 'เปิดรับคิวงานสร้างสรรค์ภาพ AI สำหรับโปรไฟล์ธุรกิจ โมเดลเสมือนจริง และภาพสินค้าโฆษณา สอบถามคิวงานหรือส่งบรีฟตัวอย่างทัก LINE ID: tatchaihot ได้ตลอด 24 ชม. ครับ',
      linkUrl: 'https://line.me/ti/p/~tatchaihot',
      isActive: true,
      sortOrder: 1,
    });
  }

  // Seed FAQs (Editable by Admin, NO 4k-8k mentions)
  if (faqCount.count === 0) {
    const defaultFaqs = [
      {
        question: 'สั่งทำภาพ AI โปรไฟล์ ต้องเตรียมรูปถ่ายอย่างไร?',
        answer: 'เตรียมรูปถ่ายหน้าตรง หันซ้าย-ขวา ครึ่งตัว และเต็มตัว รวม 4–6 รูปที่ใบหน้าชัดเจน แสงสว่างพอดี ไม่มีฟิลเตอร์หนา และไม่มีคนอื่นในภาพ (สามารถดูตัวอย่างจากภาพอินโฟกราฟิกด้านบนได้เลยครับ)',
        sortOrder: 1,
      },
      {
        question: 'นำภาพไปใช้ในเชิงพาณิชย์ (ทำโปรไฟล์ธุรกิจ ยิงแอด ลงสินค้า) ได้ไหม?',
        answer: 'ได้ 100% ครับ คุณจะได้รับสิทธิ์ในการนำภาพไปใช้งานเชิงพาณิชย์ โฆษณา หรือโปรโมทแบรนด์ส่วนตัวได้อย่างเต็มที่โดยไม่มีข้อผูกมัด',
        sortOrder: 2,
      },
      {
        question: 'ระยะเวลาในการจัดทำภาพใช้เวลากี่วัน?',
        answer: 'โดยทั่วไปใช้เวลาเพียง 24 – 48 ชั่วโมงสำหรับส่งแบบร่างตัวอย่างให้ตรวจเช็กความพึงพอใจครับ',
        sortOrder: 3,
      },
      {
        question: 'สามารถปรับแก้งานได้หรือไม่?',
        answer: 'สามารถปรับแต่งรายละเอียด เช่น ทรงผม สีหน้า โทนสีเสื้อผ้า หรือฉากหลัง เพื่อให้ได้ผลลัพธ์ที่ตรงใจและเป็นธรรมชาติที่สุดครับ',
        sortOrder: 4,
      },
      {
        question: 'ขั้นตอนการเริ่มสั่งงานทำอย่างไร?',
        answer: 'เพียงเลือกสไตล์ที่ชอบจากเว็บนี้ แล้วทัก LINE ID: tatchaihot ส่งรูปที่ต้องการทำมาคุยรายละเอียดและประเมินราคาได้ทันทีครับ',
        sortOrder: 5,
      },
    ];

    for (const f of defaultFaqs) {
      createFaq(f);
    }
  }

  // Seed Albums if empty
  if (albumCount.count === 0) {
    const alb1 = createAlbum({
      title: 'Realistic AI Models & Fashion Portraits',
      description: 'ภาพถ่ายโมเดลเสมือนคนจริง แฟชั่นนิตยสาร โฆษณาเสื้อผ้า และลุคสตูดิโอระดับไฮเอนด์ คมชัดทุกรายละเอียดผิวและเส้นผม',
      sortOrder: 1,
    });

    const alb2 = createAlbum({
      title: 'Commercial Product & Ad Creatives',
      description: 'ภาพโฆษณาสินค้า บรรจุภัณฑ์ และฉากหลังพรีเมียม สไตล์ 3D Luxury และสตูดิโอจัดแสง สำหรับยิงแอดและการตลาดออนไลน์',
      sortOrder: 2,
    });

    const alb3 = createAlbum({
      title: 'Cinematic Sci-Fi & Cyberpunk Concept Art',
      description: 'งานภาพยนตร์ โลกอนาคต ไซไฟ นีออน สเปเชียลเอฟเฟกต์ และคอนเซ็ปต์อาร์ตระดับ AAA สำหรับงานเกม นิยาย และมีเดียโปรดักชัน',
      sortOrder: 3,
    });
  }
}

try {
  seedSampleData();
} catch (e) {
  console.error('Seed error:', e);
}
