import type {
  UploadProvider,
  UploadOptions,
  UploadResult,
  DeleteOptions,
  DeleteResult,
  GetUrlOptions,
  ImageUploadConfig,
  ProviderName,
  ProviderConfig,
  SupabaseConfig,
  CloudinaryConfig,
  S3Config,
  LocalStorageConfig,
  CompressionOptions,
} from './types';
import { SupabaseProvider } from './providers/supabase';
import { CloudinaryProvider } from './providers/cloudinary';
import { S3Provider } from './providers/s3';
import { LocalStorageProvider } from './providers/local';
import { compressImage, isImage } from './utils/compression';

export type { ImageUploadConfig } from './types';

export class ImageUpload {
  private providers: Map<ProviderName, UploadProvider> = new Map();
  private defaultProvider: ProviderName;
  private defaults: ImageUploadConfig['defaults'];
  private fallbackConfig: ImageUploadConfig['fallback'];

  constructor(config: ImageUploadConfig) {
    this.defaultProvider = config.defaultProvider;
    this.defaults = config.defaults;
    this.fallbackConfig = config.fallback;
    this.initProviders(config.providers);
  }

  private initProviders(providerConfig: ProviderConfig): void {
    if (providerConfig.supabase) {
      this.providers.set('supabase', new SupabaseProvider(providerConfig.supabase));
    }

    if (providerConfig.cloudinary) {
      this.providers.set('cloudinary', new CloudinaryProvider(providerConfig.cloudinary));
    }

    if (providerConfig.s3) {
      this.providers.set('s3', new S3Provider(providerConfig.s3));
    }

    if (providerConfig.local) {
      this.providers.set('local', new LocalStorageProvider(providerConfig.local));
    }

    if (!this.providers.has(this.defaultProvider)) {
      if (this.providers.size === 0) {
        const localConfig: LocalStorageConfig = {
          uploadDir: './uploads',
          baseUrl: 'http://localhost:4000',
        };
        this.providers.set('local', new LocalStorageProvider(localConfig));
        this.defaultProvider = 'local';
      } else {
        const firstAvailable = this.providers.keys().next().value!;
        this.defaultProvider = firstAvailable;
      }
    }
  }

  getProvider(name?: ProviderName): UploadProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      const local = this.providers.get('local');
      if (local) return local;
      throw new Error(
        `Provider "${providerName}" is not configured. ` +
        `Available providers: ${Array.from(this.providers.keys()).join(', ')}`
      );
    }

    return provider;
  }

  private getFallbackProvider(): UploadProvider | null {
    if (!this.fallbackConfig?.enabled || !this.fallbackConfig?.provider) {
      return null;
    }
    return this.providers.get(this.fallbackConfig.provider) || null;
  }

  private async compressFileIfNeeded(
    file: Buffer | string,
    contentType?: string,
    compressionOptions?: CompressionOptions
  ): Promise<{ buffer: Buffer | string; compressed: boolean; originalSize?: number; compressionRatio?: number }> {
    const shouldCompress = compressionOptions?.enabled !== false && 
                          contentType && 
                          isImage(contentType);

    if (!shouldCompress) {
      return { buffer: file, compressed: false };
    }

    const buffer = typeof file === 'string' 
      ? Buffer.from(file, 'base64')
      : file;

    const result = await compressImage(buffer, {
      quality: compressionOptions?.quality || this.defaults?.compression?.quality || 80,
      maxWidth: compressionOptions?.maxWidth || this.defaults?.compression?.maxWidth || 1920,
      maxHeight: compressionOptions?.maxHeight || this.defaults?.compression?.maxHeight || 1920,
      format: compressionOptions?.format || this.defaults?.compression?.format || 'webp',
      maintainAspectRatio: compressionOptions?.maintainAspectRatio ?? true,
    });

    return {
      buffer: result.buffer,
      compressed: true,
      originalSize: result.originalSize,
      compressionRatio: result.compressionRatio,
    };
  }

  async upload(
    file: Buffer | string,
    filename: string,
    options?: UploadOptions & { provider?: ProviderName }
  ): Promise<UploadResult> {
    const provider = this.getProvider(options?.provider);
    
    const mergedOptions: UploadOptions = {
      folder: options?.folder || this.defaults?.folder,
      contentType: options?.contentType,
      metadata: options?.metadata,
      transformation: options?.transformation,
      compression: options?.compression,
    };

    try {
      const { buffer, compressed, originalSize, compressionRatio } = await this.compressFileIfNeeded(
        file,
        options?.contentType,
        options?.compression
      );

      const result = await provider.upload(buffer, filename, mergedOptions);

      return {
        ...result,
        compressed,
        originalSize,
        compressionRatio,
      };
    } catch (error) {
      const fallbackProvider = this.getFallbackProvider();
      if (fallbackProvider && fallbackProvider.name !== provider.name) {
        console.warn(`Upload failed with ${provider.name}, falling back to ${fallbackProvider.name}:`, error);
        
        const { buffer, compressed, originalSize, compressionRatio } = await this.compressFileIfNeeded(
          file,
          options?.contentType,
          options?.compression
        );

        const result = await fallbackProvider.upload(buffer, filename, mergedOptions);
        return {
          ...result,
          compressed,
          originalSize,
          compressionRatio,
        };
      }
      throw error;
    }
  }

  async delete(
    identifier: string,
    options?: DeleteOptions & { provider?: ProviderName }
  ): Promise<DeleteResult> {
    const provider = this.getProvider(options?.provider);
    return provider.delete(identifier, options);
  }

  getUrl(
    identifier: string,
    options?: GetUrlOptions & { provider?: ProviderName }
  ): string {
    const provider = this.getProvider(options?.provider);
    return provider.getUrl(identifier, options);
  }

  async uploadWithValidation(
    file: Buffer | string,
    filename: string,
    options?: UploadOptions & { provider?: ProviderName }
  ): Promise<UploadResult> {
    const allowedTypes = this.defaults?.allowedTypes;
    const maxFileSize = this.defaults?.maxFileSize;

    if (allowedTypes && options?.contentType) {
      if (!allowedTypes.includes(options.contentType)) {
        throw new Error(
          `File type "${options.contentType}" is not allowed. ` +
          `Allowed types: ${allowedTypes.join(', ')}`
        );
      }
    }

    if (maxFileSize) {
      const fileSize = typeof file === 'string'
        ? Buffer.from(file, 'base64').length
        : file.length;

      if (fileSize > maxFileSize) {
        throw new Error(
          `File size ${fileSize} bytes exceeds maximum allowed size of ${maxFileSize} bytes`
        );
      }
    }

    return this.upload(file, filename, options);
  }

  async uploadWithRetry(
    file: Buffer | string,
    filename: string,
    options?: UploadOptions & { provider?: ProviderName; retries?: number }
  ): Promise<UploadResult> {
    const retries = options?.retries || 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.upload(file, filename, options);
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }
}

export { ImageUpload as createImageUpload };

export function createImageUploadFromEnv(): ImageUpload {
  const config: ImageUploadConfig = {
    defaultProvider: (process.env.IMAGE_UPLOAD_PROVIDER as ProviderName) || 'supabase',
    providers: {},
    defaults: {
      folder: process.env.IMAGE_UPLOAD_FOLDER || 'uploads',
      allowedTypes: process.env.IMAGE_UPLOAD_ALLOWED_TYPES?.split(','),
      maxFileSize: process.env.IMAGE_UPLOAD_MAX_SIZE
        ? parseInt(process.env.IMAGE_UPLOAD_MAX_SIZE, 10)
        : undefined,
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
      provider: (process.env.IMAGE_FALLBACK_PROVIDER as ProviderName) || 'local',
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
      baseUrl: process.env.LOCAL_BASE_URL || 'http://localhost:4000',
    };
  }

  if (
    !config.providers.supabase &&
    !config.providers.cloudinary &&
    !config.providers.s3 &&
    !config.providers.local
  ) {
    config.providers.local = {
      uploadDir: './uploads',
      baseUrl: 'http://localhost:4000',
    };
    config.defaultProvider = 'local';
  }

  return new ImageUpload(config);
}
