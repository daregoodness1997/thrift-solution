import type {
  UploadProvider,
  UploadOptions,
  UploadResult,
  DeleteOptions,
  DeleteResult,
  GetUrlOptions,
  CloudinaryConfig,
  ImageTransformation,
} from '../types';
import { generateUniqueFilename, getContentType } from '../utils/validation';

export class CloudinaryProvider implements UploadProvider {
  name = 'cloudinary';
  private cloudinary: any;
  private folder: string;

  constructor(config: CloudinaryConfig) {
    this.folder = config.folder || '';
    this.initCloudinary(config);
  }

  private async initCloudinary(config: CloudinaryConfig): Promise<void> {
    const cloudinary = await import('cloudinary');
    this.cloudinary = cloudinary.v2;
    
    this.cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });
  }

  async upload(
    file: Buffer | string,
    filename: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const uniqueFilename = generateUniqueFilename(filename);
    const folder = options?.folder || this.folder;
    const contentType = options?.contentType || getContentType(filename);

    const uploadOptions: Record<string, any> = {
      public_id: uniqueFilename.replace(/\.[^/.]+$/, ''),
      resource_type: 'image',
      format: this.getFormat(filename),
    };

    if (folder) {
      uploadOptions.folder = folder;
    }

    if (options?.transformation) {
      uploadOptions.transformation = this.buildTransformation(options.transformation);
    }

    if (options?.metadata) {
      uploadOptions.context = options.metadata;
    }

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      const fileBuffer = typeof file === 'string'
        ? Buffer.from(file, 'base64')
        : file;

      uploadStream.end(fileBuffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      createdAt: result.created_at,
    };
  }

  async delete(
    identifier: string,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    try {
      await this.cloudinary.uploader.destroy(identifier, {
        resource_type: 'image',
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  getUrl(
    identifier: string,
    options?: GetUrlOptions
  ): string {
    const transformation: Record<string, any> = {};

    if (options?.transformation) {
      const t = options.transformation;
      if (t.width) transformation.width = t.width;
      if (t.height) transformation.height = t.height;
      if (t.quality) transformation.quality = t.quality;
      if (t.crop) transformation.crop = t.crop;
      if (t.gravity) transformation.gravity = t.gravity;
    }

    if (options?.format) {
      transformation.format = options.format;
    }

    return this.cloudinary.url(identifier, {
      type: 'upload',
      transformation: Object.keys(transformation).length > 0 ? transformation : undefined,
      secure: true,
    });
  }

  private getFormat(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const formatMap: Record<string, string> = {
      jpg: 'jpg',
      jpeg: 'jpg',
      png: 'png',
      gif: 'gif',
      webp: 'webp',
      svg: 'svg',
    };
    return formatMap[ext] || 'jpg';
  }

  private buildTransformation(t: ImageTransformation): any[] {
    const transformation: any[] = [];

    if (t.width || t.height) {
      const resize: Record<string, any> = {};
      if (t.width) resize.width = t.width;
      if (t.height) resize.height = t.height;
      if (t.crop) resize.crop = t.crop;
      if (t.gravity) resize.gravity = t.gravity;
      transformation.push(resize);
    }

    if (t.quality) {
      transformation.push({ quality: t.quality });
    }

    if (t.format && t.format !== 'auto') {
      transformation.push({ format: t.format });
    }

    return transformation;
  }
}
