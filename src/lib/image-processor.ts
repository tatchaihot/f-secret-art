import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

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

const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
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

/**
 * Delete image from Cloudinary (if publicId or Cloudinary URL)
 */
export async function deleteRemoteImage(publicIdOrUrl: string): Promise<boolean> {
  if (!hasCloudinary || !publicIdOrUrl) return false;
  try {
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('res.cloudinary.com')) {
      // Extract public_id between /v\d+/ and extension
      const match = publicIdOrUrl.match(/\/upload\/(?:[^\/]+\/)?(?:v\d+\/)?([^\.]+)/);
      if (match && match[1]) {
        publicId = match[1];
      }
    }
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (err) {
    console.error('Cloudinary destroy error:', err);
    return false;
  }
}

/**
 * Smart Adaptive Image Processor
 * - If Cloudinary credentials exist: Uploads to Cloudinary, zero storage duplicate
 * - If local: Uses sharp with smart checks (avoids double compression if file <= 150KB)
 */
export async function processUploadedImage(
  buffer: Buffer,
  originalFilename: string,
  folder = 'f-secret-art/gallery'
): Promise<ProcessedImageResult> {
  // 1. Analyze and auto-orient EXIF
  const pipeline = sharp(buffer).rotate();
  const metadata = await pipeline.metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 800;
  const fileSize = buffer.length;
  const isAlreadyOptimized = fileSize <= 150 * 1024; // <= 150KB

  // 2. Generate Ultra-Fast LQIP (20px blur placeholder as base64 string)
  const lqipBuffer = await sharp(buffer)
    .rotate()
    .resize(20, 20, { fit: 'inside' })
    .webp({ quality: 20 })
    .toBuffer();
  const blurDataUrl = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

  // ---------------- CLOUDINARY UPLOAD ----------------
  if (hasCloudinary) {
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    const publicId = uploadResult.public_id;
    const originalUrl = uploadResult.secure_url;

    // Cloudinary On-the-fly Transformations (Zero duplicate storage!)
    // Preview: 1600px max, auto format, auto quality
    const previewUrl = isAlreadyOptimized && width <= 1600
      ? originalUrl
      : cloudinary.url(publicId, {
          transformation: [{ width: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
          secure: true,
        });

    // Thumbnail: 600px max, auto format, auto quality for blazing mobile grids
    const thumbUrl = isAlreadyOptimized && width <= 600
      ? originalUrl
      : cloudinary.url(publicId, {
          transformation: [{ width: 600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
          secure: true,
        });

    return {
      filename: publicId,
      originalUrl,
      previewUrl,
      thumbUrl,
      blurDataUrl,
      width,
      height,
      fileSize,
    };
  }

  // ---------------- LOCAL DISK FALLBACK ----------------
  ensureUploadDirs();
  const fileId = 'img_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
  const cleanOriginalName = `${fileId}${ext}`;
  const webpName = `${fileId}.webp`;

  // Save Original File
  const originalPath = path.join(ORIGINALS_DIR, cleanOriginalName);
  await fs.promises.writeFile(originalPath, buffer);
  const originalUrl = `/uploads/originals/${cleanOriginalName}`;

  // Smart Preview: If <= 150KB and already small, use original without re-compressing
  let previewUrl = originalUrl;
  if (!isAlreadyOptimized || width > 1600) {
    const previewPath = path.join(PREVIEWS_DIR, webpName);
    await sharp(buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toFile(previewPath);
    previewUrl = `/uploads/previews/${webpName}`;
  }

  // Smart Thumbnail: If <= 600px width, use original, else generate 600px WebP
  let thumbUrl = originalUrl;
  if (width > 600) {
    const thumbPath = path.join(THUMBS_DIR, webpName);
    await sharp(buffer)
      .rotate()
      .resize({
        width: 600,
        height: 600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 75, effort: 4 })
      .toFile(thumbPath);
    thumbUrl = `/uploads/thumbs/${webpName}`;
  }

  return {
    filename: cleanOriginalName,
    originalUrl,
    previewUrl,
    thumbUrl,
    blurDataUrl,
    width,
    height,
    fileSize,
  };
}
