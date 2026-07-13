export const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFileType(
  contentType: string,
  allowedTypes: string[] = DEFAULT_ALLOWED_TYPES
): boolean {
  return allowedTypes.includes(contentType.toLowerCase());
}

export function validateFileSize(
  size: number,
  maxSize: number = DEFAULT_MAX_FILE_SIZE
): boolean {
  return size <= maxSize;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function getContentType(filename: string): string {
  const ext = getFileExtension(filename);
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = getFileExtension(originalFilename);
  const name = originalFilename.replace(/\.[^/.]+$/, '');
  const sanitized = sanitizeFilename(name);
  return `${sanitized}-${timestamp}-${random}.${ext}`;
}
