import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export interface ProcessedImageResult {
  filename: string;
  originalUrl: string;
  previewUrl: string;
  thumbUrl: string;
  blurDataUrl: string;
  width: number;
  height: number;
  fileSize: number;
}

const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');
const ORIGINALS_DIR = path.join(UPLOADS_ROOT, 'originals');
const PREVIEWS_DIR = path.join(UPLOADS_ROOT, 'previews');
const THUMBS_DIR = path.join(UPLOADS_ROOT, 'thumbs');

function ensureUploadDirs() {
  for (const dir of [ORIGINALS_DIR, PREVIEWS_DIR, THUMBS_DIR]) {
    if (!fs.existsSync(/* turbopackIgnore: true */ dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export async function processUploadedImage(
  buffer: Buffer,
  originalFilename: string
): Promise<ProcessedImageResult> {
  ensureUploadDirs();
  const fileId = 'img_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
  const cleanOriginalName = `${fileId}${ext}`;
  const webpName = `${fileId}.webp`;

  // 1. Analyze and auto-orient EXIF
  const pipeline = sharp(buffer).rotate();
  const metadata = await pipeline.metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 800;

  // 2. Save Original File
  const originalPath = path.join(ORIGINALS_DIR, cleanOriginalName);
  await fs.promises.writeFile(originalPath, buffer);

  // 3. Generate High-Res Preview (Max 1600px, WebP quality 82)
  const previewPath = path.join(PREVIEWS_DIR, webpName);
  await sharp(buffer)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 82, effort: 4 })
    .toFile(previewPath);

  // 4. Generate Mobile Grid Thumbnail (Max 600px, WebP quality 75)
  const thumbPath = path.join(THUMBS_DIR, webpName);
  await sharp(buffer)
    .rotate()
    .resize({
      width: 600,
      height: 600,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 75, effort: 4 })
    .toFile(thumbPath);

  // 5. Generate Ultra-Fast LQIP (20px blur placeholder as base64 string)
  const lqipBuffer = await sharp(buffer)
    .rotate()
    .resize(20, 20, { fit: 'inside' })
    .webp({ quality: 20 })
    .toBuffer();

  const blurDataUrl = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

  return {
    filename: cleanOriginalName,
    originalUrl: `/uploads/originals/${cleanOriginalName}`,
    previewUrl: `/uploads/previews/${webpName}`,
    thumbUrl: `/uploads/thumbs/${webpName}`,
    blurDataUrl,
    width,
    height,
    fileSize: buffer.length,
  };
}
