import type {
  UploadProvider,
  UploadOptions,
  UploadResult,
  DeleteOptions,
  DeleteResult,
  GetUrlOptions,
  SupabaseConfig,
} from '../types';
import { generateUniqueFilename, getContentType } from '../utils/validation';

export class SupabaseProvider implements UploadProvider {
  name = 'supabase';
  private client: any;
  private bucket: string;

  constructor(config: SupabaseConfig) {
    this.bucket = config.bucket;
    this.initClient(config);
  }

  private async initClient(config: SupabaseConfig): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');
    this.client = createClient(config.url, config.serviceRoleKey || config.anonKey);
  }

  private async ensureClient(): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }
  }

  async upload(
    file: Buffer | string,
    filename: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    await this.ensureClient();

    const uniqueFilename = generateUniqueFilename(filename);
    const folder = options?.folder || '';
    const path = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

    const contentType = options?.contentType || getContentType(filename);

    const fileBuffer = typeof file === 'string' 
      ? Buffer.from(file, 'base64')
      : file;

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(path, fileBuffer, {
        contentType,
        metadata: options?.metadata,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: urlData } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      publicId: data.path,
      bytes: fileBuffer.length,
      createdAt: new Date().toISOString(),
    };
  }

  async delete(
    identifier: string,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    await this.ensureClient();

    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([identifier]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  }

  getUrl(
    identifier: string,
    options?: GetUrlOptions
  ): string {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    const { data } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(identifier);

    let url = data.publicUrl;

    if (options?.transformation) {
      const params = new URLSearchParams();
      const t = options.transformation;
      
      if (t.width) params.set('width', t.width.toString());
      if (t.height) params.set('height', t.height.toString());
      if (t.quality) params.set('quality', t.quality.toString());
      if (t.format) params.set('format', t.format);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    return url;
  }
}
