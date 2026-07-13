import multer from 'multer';
import { ImageUpload, ImageUploadConfig } from '@thrift/image-upload';

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }
  },
});

function getImageUploadConfig(): ImageUploadConfig {
  const provider = (process.env.IMAGE_UPLOAD_PROVIDER as any) || 'supabase';

  const config: ImageUploadConfig = {
    defaultProvider: provider,
    providers: {},
    defaults: {
      folder: process.env.IMAGE_UPLOAD_FOLDER || 'uploads',
      allowedTypes: ALLOWED_MIME_TYPES,
      maxFileSize: MAX_FILE_SIZE,
      compression: {
        enabled: process.env.IMAGE_COMPRESSION_ENABLED !== 'false',
        quality: process.env.IMAGE_COMPRESSION_QUALITY 
          ? parseInt(process.env.IMAGE_COMPRESSION_QUALITY, 10) 
          : 80,
        maxWidth: process.env.IMAGE_COMPRESSION_MAX_WIDTH
          ? parseInt(process.env.IMAGE_COMPRESSION_MAX_WIDTH, 10)
          : 1920,
        maxHeight: process.env.IMAGE_COMPRESSION_MAX_HEIGHT
          ? parseInt(process.env.IMAGE_COMPRESSION_MAX_HEIGHT, 10)
          : 1920,
        format: (process.env.IMAGE_COMPRESSION_FORMAT as any) || 'webp',
      },
    },
    fallback: {
      enabled: process.env.IMAGE_FALLBACK_ENABLED === 'true',
      provider: (process.env.IMAGE_FALLBACK_PROVIDER as any) || 'local',
    },
  };

  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    config.providers.supabase = {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      bucket: process.env.SUPABASE_BUCKET || 'images',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    config.providers.cloudinary = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      folder: process.env.CLOUDINARY_FOLDER,
    };
  }

  if (process.env.AWS_S3_REGION && process.env.AWS_S3_BUCKET) {
    config.providers.s3 = {
      region: process.env.AWS_S3_REGION,
      bucket: process.env.AWS_S3_BUCKET,
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || '',
      endpoint: process.env.AWS_S3_ENDPOINT,
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
    };
  }

  if (process.env.LOCAL_UPLOAD_DIR || config.fallback?.provider === 'local') {
    config.providers.local = {
      uploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
      baseUrl: process.env.LOCAL_BASE_URL || `http://localhost:${process.env.PORT || 4000}`,
    };
  }

  if (
    !config.providers.supabase &&
    !config.providers.cloudinary &&
    !config.providers.s3
  ) {
    config.providers.local = config.providers.local || {
      uploadDir: './uploads',
      baseUrl: `http://localhost:${process.env.PORT || 4000}`,
    };
    config.defaultProvider = 'local';
  }

  return config;
}

let imageUploadInstance: ImageUpload | null = null;

export function getImageUpload(): ImageUpload {
  if (!imageUploadInstance) {
    imageUploadInstance = new ImageUpload(getImageUploadConfig());
  }
  return imageUploadInstance;
}

export async function uploadFile(
  file: Express.Multer.File,
  folder?: string
): Promise<{ 
  url: string; 
  publicId: string; 
  size: number;
  compressed?: boolean;
  originalSize?: number;
  compressionRatio?: number;
}> {
  const imageUpload = getImageUpload();
  
  const result = await imageUpload.upload(file.buffer, file.originalname, {
    folder,
    contentType: file.mimetype,
  });

  return {
    url: result.url,
    publicId: result.publicId || '',
    size: file.size,
    compressed: result.compressed,
    originalSize: result.originalSize,
    compressionRatio: result.compressionRatio,
  };
}

export async function uploadFileWithRetry(
  file: Express.Multer.File,
  folder?: string,
  retries?: number
): Promise<{ 
  url: string; 
  publicId: string; 
  size: number;
  compressed?: boolean;
  originalSize?: number;
  compressionRatio?: number;
}> {
  const imageUpload = getImageUpload();
  
  const result = await imageUpload.uploadWithRetry(file.buffer, file.originalname, {
    folder,
    contentType: file.mimetype,
    retries,
  });

  return {
    url: result.url,
    publicId: result.publicId || '',
    size: file.size,
    compressed: result.compressed,
    originalSize: result.originalSize,
    compressionRatio: result.compressionRatio,
  };
}

export async function deleteFile(publicId: string): Promise<boolean> {
  const imageUpload = getImageUpload();
  const result = await imageUpload.delete(publicId);
  return result.success;
}
