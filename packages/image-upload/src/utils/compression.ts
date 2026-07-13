import sharp from 'sharp';

export interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  maintainAspectRatio?: boolean;
}

export interface CompressionResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  quality: 80,
  maxWidth: 1920,
  maxHeight: 1920,
  format: 'webp',
  maintainAspectRatio: true,
};

const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/tiff',
];

export function isImage(contentType: string): boolean {
  return IMAGE_MIME_TYPES.includes(contentType.toLowerCase());
}

export async function compressImage(
  buffer: Buffer,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = buffer.length;

  const metadata = await sharp(buffer).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  let sharpInstance = sharp(buffer);

  if (opts.maxWidth || opts.maxHeight) {
    sharpInstance = sharpInstance.resize({
      width: opts.maxWidth,
      height: opts.maxHeight,
      fit: opts.maintainAspectRatio ? 'inside' : 'fill',
      withoutEnlargement: true,
    });
  }

  const outputFormat = opts.format || 'webp';
  
  switch (outputFormat) {
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({
        quality: opts.quality,
        progressive: true,
        mozjpeg: true,
      });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({
        quality: opts.quality,
        compressionLevel: 9,
        adaptiveFiltering: true,
      });
      break;
    case 'webp':
      sharpInstance = sharpInstance.webp({
        quality: opts.quality,
        effort: 6,
      });
      break;
    case 'avif':
      sharpInstance = sharpInstance.avif({
        quality: opts.quality,
        effort: 6,
      });
      break;
  }

  const result = await sharpInstance.toBuffer({ resolveWithObject: true });
  
  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    format: result.info.format,
    size: result.data.length,
    originalSize,
    compressionRatio: Math.round((1 - result.data.length / originalSize) * 100),
  };
}

export async function generateThumbnails(
  buffer: Buffer,
  sizes: Array<{ width: number; height: number; suffix: string }> = [
    { width: 150, height: 150, suffix: 'thumb' },
    { width: 300, height: 300, suffix: 'medium' },
    { width: 800, height: 800, suffix: 'large' },
  ],
  format: 'jpeg' | 'png' | 'webp' = 'webp'
): Promise<Array<{ buffer: Buffer; suffix: string; width: number; height: number }>> {
  const thumbnails = [];

  for (const size of sizes) {
    const result = await sharp(buffer)
      .resize({
        width: size.width,
        height: size.height,
        fit: 'cover',
        position: 'centre',
      })
      .toFormat(format, { quality: 80 })
      .toBuffer({ resolveWithObject: true });

    thumbnails.push({
      buffer: result.data,
      suffix: size.suffix,
      width: result.info.width,
      height: result.info.height,
    });
  }

  return thumbnails;
}

export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
  channels: number;
}> {
  const metadata = await sharp(buffer).metadata();
  
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: buffer.length,
    hasAlpha: metadata.hasAlpha || false,
    channels: metadata.channels || 0,
  };
}

export async function convertFormat(
  buffer: Buffer,
  format: 'jpeg' | 'png' | 'webp' | 'avif',
  quality: number = 80
): Promise<Buffer> {
  let sharpInstance = sharp(buffer);

  switch (format) {
    case 'jpeg':
      sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
      break;
    case 'png':
      sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
      break;
    case 'webp':
      sharpInstance = sharpInstance.webp({ quality });
      break;
    case 'avif':
      sharpInstance = sharpInstance.avif({ quality });
      break;
  }

  return sharpInstance.toBuffer();
}

export async function optimizeForWeb(
  buffer: Buffer,
  options: {
    quality?: number;
    maxWidth?: number;
    format?: 'jpeg' | 'png' | 'webp' | 'avif';
  } = {}
): Promise<CompressionResult> {
  return compressImage(buffer, {
    quality: options.quality || 75,
    maxWidth: options.maxWidth || 1200,
    maxHeight: 800,
    format: options.format || 'webp',
    maintainAspectRatio: true,
  });
}

export async function optimizeForMobile(
  buffer: Buffer,
  options: {
    quality?: number;
    maxWidth?: number;
    format?: 'jpeg' | 'png' | 'webp' | 'avif';
  } = {}
): Promise<CompressionResult> {
  return compressImage(buffer, {
    quality: options.quality || 70,
    maxWidth: options.maxWidth || 640,
    maxHeight: 480,
    format: options.format || 'webp',
    maintainAspectRatio: true,
  });
}
