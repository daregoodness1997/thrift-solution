export interface UploadOptions {
  folder?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  transformation?: ImageTransformation;
  compression?: CompressionOptions;
}

export interface ImageTransformation {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'png' | 'jpg';
  crop?: 'scale' | 'fit' | 'fill' | 'limit' | 'pad';
  gravity?: 'auto' | 'center' | 'north' | 'south' | 'east' | 'west';
}

export interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  maintainAspectRatio?: boolean;
  enabled?: boolean;
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

export interface UploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  createdAt?: string;
  compressed?: boolean;
  originalSize?: number;
  compressionRatio?: number;
}

export interface DeleteOptions {
  folder?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface GetUrlOptions {
  transformation?: ImageTransformation;
  format?: string;
  quality?: number | 'auto';
}

export interface UploadProvider {
  name: string;
  
  upload(
    file: Buffer | string,
    filename: string,
    options?: UploadOptions
  ): Promise<UploadResult>;
  
  delete(
    identifier: string,
    options?: DeleteOptions
  ): Promise<DeleteResult>;
  
  getUrl(
    identifier: string,
    options?: GetUrlOptions
  ): string;
}

export type ProviderConfig = {
  supabase?: SupabaseConfig;
  cloudinary?: CloudinaryConfig;
  s3?: S3Config;
  local?: LocalStorageConfig;
};

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  bucket: string;
  serviceRoleKey?: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
}

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export interface LocalStorageConfig {
  uploadDir: string;
  baseUrl: string;
  maxAge?: number;
}

export type ProviderName = 'supabase' | 'cloudinary' | 's3' | 'local';

export interface ImageUploadConfig {
  defaultProvider: ProviderName;
  providers: ProviderConfig;
  defaults?: {
    folder?: string;
    allowedTypes?: string[];
    maxFileSize?: number;
    compression?: CompressionOptions;
  };
  fallback?: {
    enabled: boolean;
    provider: ProviderName;
  };
}
