import { createClient, Client } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:data/gallery.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db: Client = createClient({
  url,
  authToken,
});

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
  previewPhotos?: string[];
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

let isInitialized = false;

export async function ensureDbInitialized() {
  if (isInitialized) return;

  await db.execute(`
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
  `);

  await db.execute(`
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

  await db.execute(`
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
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `);

  isInitialized = true;
}

// Helper to ensure database rows are clean, plain JS objects across React Server Component boundaries
function toPlainRows<T>(rows: any[]): T[] {
  return rows.map((r) => ({ ...r })) as T[];
}

function toPlainRow<T>(row: any): T {
  return { ...row } as T;
}

// ----------------- ALBUM QUERIES -----------------
export async function getAllAlbums(): Promise<Album[]> {
  await ensureDbInitialized();
  const res = await db.execute(`
    SELECT a.*, COUNT(p.id) as photoCount
    FROM albums a
    LEFT JOIN photos p ON a.id = p.albumId
    GROUP BY a.id
    ORDER BY a.sortOrder ASC, a.createdAt DESC
  `);
  const albums = toPlainRows<Album>(res.rows);

  // Fetch top 4 preview photos for each album for the 4-photo collage covers
  try {
    const previewRes = await db.execute(`
      SELECT albumId, thumbUrl, previewUrl, originalUrl
      FROM (
        SELECT albumId, thumbUrl, previewUrl, originalUrl,
               ROW_NUMBER() OVER (PARTITION BY albumId ORDER BY sortOrder ASC, createdAt DESC) as rn
        FROM photos
      )
      WHERE rn <= 4
    `);
    const previewRows = toPlainRows<{ albumId: string; thumbUrl: string; previewUrl: string; originalUrl: string }>(previewRes.rows);

    const map = new Map<string, string[]>();
    for (const row of previewRows) {
      const url = row.thumbUrl || row.previewUrl || row.originalUrl;
      if (!url) continue;
      if (!map.has(row.albumId)) {
        map.set(row.albumId, []);
      }
      map.get(row.albumId)!.push(url);
    }

    for (const album of albums) {
      const list = map.get(album.id) || [];
      if (album.coverImage && !list.includes(album.coverImage)) {
        album.previewPhotos = [album.coverImage, ...list].slice(0, 4);
      } else {
        album.previewPhotos = list.slice(0, 4);
      }
    }
  } catch (err) {
    console.error('Error fetching preview photos for albums:', err);
    for (const album of albums) {
      album.previewPhotos = album.coverImage ? [album.coverImage] : [];
    }
  }

  return albums;
}

export async function getAlbumBySlug(slug: string): Promise<(Album & { photos: Photo[] }) | null> {
  await ensureDbInitialized();
  const albumRes = await db.execute({
    sql: 'SELECT * FROM albums WHERE slug = ?',
    args: [slug],
  });

  if (albumRes.rows.length === 0) return null;
  const album = toPlainRow<Album>(albumRes.rows[0]);

  const photosRes = await db.execute({
    sql: 'SELECT * FROM photos WHERE albumId = ? ORDER BY sortOrder ASC, createdAt DESC',
    args: [album.id],
  });

  const photos = toPlainRows<Photo>(photosRes.rows);
  return { ...album, photos };
}

export async function getAlbumById(id: string): Promise<(Album & { photos: Photo[] }) | null> {
  await ensureDbInitialized();
  const albumRes = await db.execute({
    sql: 'SELECT * FROM albums WHERE id = ?',
    args: [id],
  });

  if (albumRes.rows.length === 0) return null;
  const album = toPlainRow<Album>(albumRes.rows[0]);

  const photosRes = await db.execute({
    sql: 'SELECT * FROM photos WHERE albumId = ? ORDER BY sortOrder ASC, createdAt DESC',
    args: [id],
  });

  const photos = toPlainRows<Photo>(photosRes.rows);
  return { ...album, photos };
}

export async function createAlbum(data: {
  title: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
}): Promise<Album> {
  await ensureDbInitialized();
  const id = 'alb_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const now = new Date().toISOString();
  const slug =
    (data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')) +
    '-' +
    Math.random().toString(36).substring(2, 6);

  await db.execute({
    sql: `INSERT INTO albums (id, title, slug, description, sortOrder, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.title,
      slug,
      data.description || null,
      data.sortOrder ?? 0,
      now,
      now,
    ],
  });

  const created = await getAlbumById(id);
  return created!;
}

export async function updateAlbum(id: string, data: Partial<Album>): Promise<Album | null> {
  await ensureDbInitialized();
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

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  await db.execute({
    sql: `UPDATE albums SET ${fields.join(', ')} WHERE id = ?`,
    args: values,
  });

  return getAlbumById(id);
}

export async function deleteAlbum(id: string): Promise<boolean> {
  await ensureDbInitialized();
  const res = await db.execute({
    sql: 'DELETE FROM albums WHERE id = ?',
    args: [id],
  });
  return res.rowsAffected > 0;
}

// ----------------- PHOTO QUERIES -----------------
export async function createPhoto(data: {
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
}): Promise<Photo> {
  await ensureDbInitialized();
  const id = 'pho_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO photos (id, albumId, originalName, filename, originalUrl, previewUrl, thumbUrl, blurDataUrl, width, height, fileSize, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
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
      now,
    ],
  });

  // If album has no cover image yet, set it to this photo's thumbUrl
  const albumRes = await db.execute({
    sql: 'SELECT coverImage FROM albums WHERE id = ?',
    args: [data.albumId],
  });
  const album = albumRes.rows[0];
  if (album && !album.coverImage) {
    await db.execute({
      sql: 'UPDATE albums SET coverImage = ? WHERE id = ?',
      args: [data.thumbUrl, data.albumId],
    });
  }

  const photoRes = await db.execute({
    sql: 'SELECT * FROM photos WHERE id = ?',
    args: [id],
  });
  return photoRes.rows[0] as unknown as Photo;
}

export async function movePhotos(photoIds: string[], targetAlbumId: string): Promise<number> {
  if (!photoIds.length) return 0;
  await ensureDbInitialized();
  const placeholders = photoIds.map(() => '?').join(',');
  const res = await db.execute({
    sql: `UPDATE photos SET albumId = ? WHERE id IN (${placeholders})`,
    args: [targetAlbumId, ...photoIds],
  });

  // Ensure target album has cover if none
  const targetAlbumRes = await db.execute({
    sql: 'SELECT coverImage FROM albums WHERE id = ?',
    args: [targetAlbumId],
  });
  const targetAlbum = targetAlbumRes.rows[0];
  if (targetAlbum && !targetAlbum.coverImage) {
    const firstPhoto = await db.execute({
      sql: 'SELECT thumbUrl FROM photos WHERE albumId = ? LIMIT 1',
      args: [targetAlbumId],
    });
    if (firstPhoto.rows.length > 0) {
      await db.execute({
        sql: 'UPDATE albums SET coverImage = ? WHERE id = ?',
        args: [firstPhoto.rows[0].thumbUrl, targetAlbumId],
      });
    }
  }

  return res.rowsAffected;
}

export async function getPhotosByIds(photoIds: string[]): Promise<Array<{ filename: string; originalUrl: string }>> {
  if (!photoIds.length) return [];
  await ensureDbInitialized();
  const placeholders = photoIds.map(() => '?').join(',');
  const res = await db.execute({
    sql: `SELECT filename, originalUrl FROM photos WHERE id IN (${placeholders})`,
    args: photoIds,
  });
  return res.rows as unknown as Array<{ filename: string; originalUrl: string }>;
}

export async function deletePhotos(photoIds: string[]): Promise<number> {
  if (!photoIds.length) return 0;
  await ensureDbInitialized();
  const placeholders = photoIds.map(() => '?').join(',');
  const res = await db.execute({
    sql: `DELETE FROM photos WHERE id IN (${placeholders})`,
    args: photoIds,
  });
  return res.rowsAffected;
}

export async function setAlbumCover(albumId: string, photoThumbUrl: string): Promise<boolean> {
  await ensureDbInitialized();
  const res = await db.execute({
    sql: 'UPDATE albums SET coverImage = ? WHERE id = ?',
    args: [photoThumbUrl, albumId],
  });
  return res.rowsAffected > 0;
}

// ----------------- ANNOUNCEMENT QUERIES -----------------
export async function getAllAnnouncements(): Promise<Announcement[]> {
  await ensureDbInitialized();
  const res = await db.execute('SELECT * FROM announcements ORDER BY sortOrder ASC, createdAt DESC');
  return toPlainRows<Announcement>(res.rows);
}

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  await ensureDbInitialized();
  const res = await db.execute('SELECT * FROM announcements WHERE isActive = 1 ORDER BY sortOrder ASC, createdAt DESC');
  return toPlainRows<Announcement>(res.rows);
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  await ensureDbInitialized();
  const res = await db.execute({
    sql: 'SELECT * FROM announcements WHERE id = ?',
    args: [id],
  });
  if (res.rows.length === 0) return null;
  return toPlainRow<Announcement>(res.rows[0]);
}

export async function createAnnouncement(data: {
  title: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<Announcement> {
  await ensureDbInitialized();
  const id = 'ann_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO announcements (id, title, content, imageUrl, linkUrl, isActive, sortOrder, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.title,
      data.content || null,
      data.imageUrl || null,
      data.linkUrl || null,
      data.isActive !== false ? 1 : 0,
      data.sortOrder ?? 0,
      now,
    ],
  });

  const created = await getAnnouncementById(id);
  return created!;
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>): Promise<Announcement | null> {
  await ensureDbInitialized();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['title', 'content', 'imageUrl', 'linkUrl', 'isActive', 'sortOrder'];
  for (const key of allowedFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push((data as any)[key]);
    }
  }

  if (fields.length === 0) return getAnnouncementById(id);

  values.push(id);
  await db.execute({
    sql: `UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`,
    args: values,
  });
  return getAnnouncementById(id);
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  await ensureDbInitialized();
  const res = await db.execute({
    sql: 'DELETE FROM announcements WHERE id = ?',
    args: [id],
  });
  return res.rowsAffected > 0;
}

// ----------------- FAQ QUERIES -----------------
export async function getAllFaqs(): Promise<FaqItem[]> {
  await ensureDbInitialized();
  const res = await db.execute('SELECT * FROM faqs ORDER BY sortOrder ASC, createdAt ASC');
  return toPlainRows<FaqItem>(res.rows);
}

export async function getFaqById(id: string): Promise<FaqItem | null> {
  await ensureDbInitialized();
  const res = await db.execute({
    sql: 'SELECT * FROM faqs WHERE id = ?',
    args: [id],
  });
  if (res.rows.length === 0) return null;
  return toPlainRow<FaqItem>(res.rows[0]);
}

export async function createFaq(data: {
  question: string;
  answer: string;
  sortOrder?: number;
}): Promise<FaqItem> {
  await ensureDbInitialized();
  const id = 'faq_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO faqs (id, question, answer, sortOrder, createdAt)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      id,
      data.question,
      data.answer,
      data.sortOrder ?? 0,
      now,
    ],
  });

  const created = await getFaqById(id);
  return created!;
}

export async function updateFaq(id: string, data: Partial<FaqItem>): Promise<FaqItem | null> {
  await ensureDbInitialized();
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ['question', 'answer', 'sortOrder'];
  for (const key of allowedFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push((data as any)[key]);
    }
  }

  if (fields.length === 0) return getFaqById(id);

  values.push(id);
  await db.execute({
    sql: `UPDATE faqs SET ${fields.join(', ')} WHERE id = ?`,
    args: values,
  });
  return getFaqById(id);
}

export async function deleteFaq(id: string): Promise<boolean> {
  await ensureDbInitialized();
  const res = await db.execute({
    sql: 'DELETE FROM faqs WHERE id = ?',
    args: [id],
  });
  return res.rowsAffected > 0;
}

// ----------------- SEED DATA -----------------
export async function seedSampleData() {
  await ensureDbInitialized();
  const albumRes = await db.execute('SELECT COUNT(*) as count FROM albums');
  const faqRes = await db.execute('SELECT COUNT(*) as count FROM faqs');
  const annRes = await db.execute('SELECT COUNT(*) as count FROM announcements');

  const albumCount = Number(albumRes.rows[0].count) || 0;
  const faqCount = Number(faqRes.rows[0].count) || 0;
  const annCount = Number(annRes.rows[0].count) || 0;

  if (annCount === 0) {
    await createAnnouncement({
      title: 'ยินดีต้อนรับสู่ F-Secret AI Art · สตูดิโอสร้างสรรค์ภาพ AI ระดับพรีเมียม',
      content:
        'เปิดรับคิวงานสร้างสรรค์ภาพ AI สำหรับโปรไฟล์ธุรกิจ โมเดลเสมือนจริง และภาพสินค้าโฆษณา สอบถามคิวงานหรือส่งบรีฟตัวอย่างทัก LINE ID: tatchaihot ได้ตลอด 24 ชม. เลยนะคะ',
      linkUrl: 'https://line.me/ti/p/~tatchaihot',
      isActive: true,
      sortOrder: 1,
    });
  }

  if (faqCount === 0) {
    const defaultFaqs = [
      {
        question: 'สั่งทำภาพ AI โปรไฟล์ ต้องเตรียมรูปถ่ายอย่างไร?',
        answer:
          'เตรียมรูปถ่ายหน้าตรง หันซ้าย-ขวา ครึ่งตัว และเต็มตัว รวม 4–6 รูปที่ใบหน้าชัดเจน แสงสว่างพอดี ไม่มีฟิลเตอร์หนา และไม่มีคนอื่นในภาพ (สามารถดูตัวอย่างจากภาพอินโฟกราฟิกด้านบนได้เลยนะคะ)',
        sortOrder: 1,
      },
      {
        question: 'นำภาพไปใช้ในเชิงพาณิชย์ (ทำโปรไฟล์ธุรกิจ ยิงแอด ลงสินค้า) ได้ไหม?',
        answer:
          'ได้ 100% เลยค่ะ คุณจะได้รับสิทธิ์ในการนำภาพไปใช้งานเชิงพาณิชย์ โฆษณา หรือโปรโมทแบรนด์ส่วนตัวได้อย่างเต็มที่โดยไม่มีข้อผูกมัด',
        sortOrder: 2,
      },
      {
        question: 'ระยะเวลาในการจัดทำภาพใช้เวลากี่วัน?',
        answer: 'โดยทั่วไปใช้เวลาเพียง 24 – 48 ชั่วโมงสำหรับส่งแบบร่างตัวอย่างให้ตรวจเช็กความพึงพอใจค่ะ',
        sortOrder: 3,
      },
      {
        question: 'สามารถปรับแก้งานได้หรือไม่?',
        answer:
          'สามารถปรับแต่งรายละเอียด เช่น ทรงผม สีหน้า โทนสีเสื้อผ้า หรือฉากหลัง เพื่อให้ได้ผลลัพธ์ที่ตรงใจและเป็นธรรมชาติที่สุดค่ะ',
        sortOrder: 4,
      },
      {
        question: 'ขั้นตอนการเริ่มสั่งงานทำอย่างไร?',
        answer:
          'เพียงเลือกสไตล์ที่ชอบจากเว็บนี้ แล้วทัก LINE ID: tatchaihot ส่งรูปที่ต้องการทำมาคุยรายละเอียดและประเมินราคาได้ทันทีเลยค่ะ',
        sortOrder: 5,
      },
    ];

    for (const f of defaultFaqs) {
      await createFaq(f);
    }
  }

  if (albumCount === 0) {
    await createAlbum({
      title: 'Realistic AI Models & Fashion Portraits',
      description:
        'ภาพถ่ายโมเดลเสมือนคนจริง แฟชั่นนิตยสาร โฆษณาเสื้อผ้า และลุคสตูดิโอระดับไฮเอนด์ คมชัดทุกรายละเอียดผิวและเส้นผม',
      sortOrder: 1,
    });

    await createAlbum({
      title: 'Commercial Product & Ad Creatives',
      description:
        'ภาพโฆษณาสินค้า บรรจุภัณฑ์ และฉากหลังพรีเมียม สไตล์ 3D Luxury และสตูดิโอจัดแสง สำหรับยิงแอดและการตลาดออนไลน์',
      sortOrder: 2,
    });

    await createAlbum({
      title: 'Cinematic Sci-Fi & Cyberpunk Concept Art',
      description:
        'งานภาพยนตร์ โลกอนาคต ไซไฟ นีออน สเปเชียลเอฟเฟกต์ และคอนเซ็ปต์อาร์ตระดับ AAA สำหรับงานเกม นิยาย และมีเดียโปรดักชัน',
      sortOrder: 3,
    });
  }
}
