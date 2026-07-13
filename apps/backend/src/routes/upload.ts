import { Router, Request, Response } from 'express';
import { upload, uploadFile, deleteFile } from '../utils/upload';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post(
  '/',
  authMiddleware,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const folder = req.body.folder as string | undefined;
      const result = await uploadFile(req.file, folder);

      res.json({
        url: result.url,
        publicId: result.publicId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: result.size,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
  }
);

router.post(
  '/multiple',
  authMiddleware,
  upload.array('files', 10),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      const folder = req.body.folder as string | undefined;
      const results = await Promise.all(
        files.map(async (file) => {
          const result = await uploadFile(file, folder);
          return {
            url: result.url,
            publicId: result.publicId,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: result.size,
          };
        })
      );

      res.json({ files: results });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload files' });
    }
  }
);

router.delete(
  '/:publicId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { publicId } = req.params;
      const decodedId = decodeURIComponent(publicId);
      const success = await deleteFile(decodedId);

      if (success) {
        res.json({ message: 'File deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete file' });
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete file' });
    }
  }
);

export { router as uploadRouter };
