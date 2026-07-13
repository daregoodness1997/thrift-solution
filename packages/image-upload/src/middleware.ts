import { Request, Response, NextFunction } from 'express';
import { ImageUpload } from './index';
import type { ImageUploadConfig } from './types';

declare global {
  namespace Express {
    interface Request {
      imageUpload?: ImageUpload;
      uploadResults?: any;
      file?: MulterFile;
      files?: { [fieldname: string]: MulterFile[] | MulterFile };
    }
  }
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadMiddlewareOptions {
  fieldName?: string;
  maxFiles?: number;
  folder?: string;
  provider?: 'supabase' | 'cloudinary' | 's3';
  allowedTypes?: string[];
  maxFileSize?: number;
}

export function createUploadMiddleware(
  config: ImageUploadConfig,
  options: UploadMiddlewareOptions = {}
) {
  const imageUpload = new ImageUpload(config);
  
  const {
    fieldName = 'file',
    maxFiles = 1,
    folder,
    provider,
    allowedTypes,
    maxFileSize,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.imageUpload = imageUpload;

      const reqWithFiles = req as any;

      if (!reqWithFiles.file && !reqWithFiles.files) {
        return next();
      }

      const files = reqWithFiles.files
        ? Array.isArray(reqWithFiles.files[fieldName])
          ? reqWithFiles.files[fieldName]
          : [reqWithFiles.files[fieldName]]
        : [reqWithFiles.file];

      if (files.length > maxFiles) {
        return res.status(400).json({
          error: `Too many files. Maximum allowed: ${maxFiles}`,
        });
      }

      const uploadResults = [];

      for (const file of files) {
        if (!file) continue;

        if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            error: `File type ${file.mimetype} is not allowed`,
          });
        }

        if (maxFileSize && file.size > maxFileSize) {
          return res.status(400).json({
            error: `File size exceeds maximum allowed size of ${maxFileSize} bytes`,
          });
        }

        const result = await imageUpload.uploadWithValidation(
          file.buffer,
          file.originalname,
          {
            folder,
            contentType: file.mimetype,
            provider,
          }
        );

        uploadResults.push(result);
      }

      req.uploadResults = uploadResults.length === 1 ? uploadResults[0] : uploadResults;

      next();
    } catch (error: any) {
      next(error);
    }
  };
}
