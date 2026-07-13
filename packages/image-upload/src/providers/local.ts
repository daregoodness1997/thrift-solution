import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
  UploadProvider,
  UploadOptions,
  UploadResult,
  DeleteOptions,
  DeleteResult,
  GetUrlOptions,
} from '../types';

export interface LocalStorageConfig {
  uploadDir: string;
  baseUrl: string;
  maxAge?: number;
}

export class LocalStorageProvider implements UploadProvider {
  name = 'local';
  private uploadDir: string;
  private baseUrl: string;

  constructor(config: LocalStorageConfig) {
    this.uploadDir = config.uploadDir;
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  private generateFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalFilename);
    const name = path.basename(originalFilename, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${name}-${timestamp}-${random}${ext}`;
  }

  private getRelativePath(filename: string, folder?: string): string {
    return folder ? `${folder}/${filename}` : filename;
  }

  private getFullPath(relativePath: string): string {
    return path.join(this.uploadDir, relativePath);
  }

  private buildUrl(relativePath: string): string {
    return `${this.baseUrl}/uploads/${relativePath}`;
  }

  async upload(
    file: Buffer | string,
    filename: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const uniqueFilename = this.generateFilename(filename);
    const folder = options?.folder;
    const relativePath = this.getRelativePath(uniqueFilename, folder);
    const fullPath = this.getFullPath(relativePath);

    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    const fileBuffer = typeof file === 'string'
      ? Buffer.from(file, 'base64')
      : file;

    await fs.writeFile(fullPath, fileBuffer);

    return {
      url: this.buildUrl(relativePath),
      publicId: relativePath,
      bytes: fileBuffer.length,
      createdAt: new Date().toISOString(),
    };
  }

  async delete(
    identifier: string,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    try {
      const fullPath = this.getFullPath(identifier);
      await fs.unlink(fullPath);
      
      const dir = path.dirname(fullPath);
      try {
        const files = await fs.readdir(dir);
        if (files.length === 0) {
          await fs.rmdir(dir);
        }
      } catch {
        // Directory might not be empty or doesn't exist
      }

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
    return this.buildUrl(identifier);
  }

  async getAbsolutePath(identifier: string): Promise<string> {
    return this.getFullPath(identifier);
  }

  async fileExists(identifier: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(identifier);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(identifier: string): Promise<number> {
    const fullPath = this.getFullPath(identifier);
    const stats = await fs.stat(fullPath);
    return stats.size;
  }
}
