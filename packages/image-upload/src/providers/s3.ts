import type {
  UploadProvider,
  UploadOptions,
  UploadResult,
  DeleteOptions,
  DeleteResult,
  GetUrlOptions,
  S3Config,
} from '../types';
import { generateUniqueFilename, getContentType } from '../utils/validation';

export class S3Provider implements UploadProvider {
  name = 's3';
  private client: any;
  private bucket: string;
  private region: string;

  constructor(config: S3Config) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.initClient(config);
  }

  private async initClient(config: S3Config): Promise<void> {
    const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
    
    this.client = {
      S3Client,
      PutObjectCommand,
      DeleteObjectCommand,
      HeadObjectCommand,
      GetObjectCommand,
    };

    const s3Config: Record<string, any> = {
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    };

    if (config.endpoint) {
      s3Config.endpoint = config.endpoint;
      s3Config.forcePathStyle = config.forcePathStyle || false;
    }

    this.client.instance = new this.client.S3Client(s3Config);
  }

  async upload(
    file: Buffer | string,
    filename: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const uniqueFilename = generateUniqueFilename(filename);
    const folder = options?.folder || '';
    const key = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;
    const contentType = options?.contentType || getContentType(filename);

    const fileBuffer = typeof file === 'string'
      ? Buffer.from(file, 'base64')
      : file;

    const command = new this.client.PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: options?.metadata,
    });

    await this.client.instance.send(command);

    const url = this.getDirectUrl(key);

    return {
      url,
      publicId: key,
      bytes: fileBuffer.length,
      createdAt: new Date().toISOString(),
    };
  }

  async delete(
    identifier: string,
    options?: DeleteOptions
  ): Promise<DeleteResult> {
    try {
      const command = new this.client.DeleteObjectCommand({
        Bucket: this.bucket,
        Key: identifier,
      });

      await this.client.instance.send(command);
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
    return this.getDirectUrl(identifier);
  }

  private getDirectUrl(key: string): string {
    if (this.region === 'us-east-1') {
      return `https://${this.bucket}.s3.amazonaws.com/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async getSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    
    const command = new this.client.GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client.instance, command, { expiresIn });
  }
}
