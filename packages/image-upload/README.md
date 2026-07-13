# @thrift/image-upload

A pluggable image upload package supporting multiple cloud providers (Supabase, Cloudinary, AWS S3, Local Storage) with automatic image compression and fallback support.

## Features

- **Multiple Providers**: Supabase, Cloudinary, AWS S3, Local Storage
- **Automatic Image Compression**: Reduce file sizes using Sharp
- **Fallback Support**: Automatically fall back to local storage if cloud providers fail
- **Retry Logic**: Built-in retry mechanism with exponential backoff
- **File Validation**: Validate file types and sizes before upload
- **TypeScript**: Full TypeScript support with exported types

## Installation

```bash
pnpm add @thrift/image-upload
```

Install the provider SDK you need:

```bash
# For Supabase
pnpm add @supabase/supabase-js

# For Cloudinary
pnpm add cloudinary

# For AWS S3
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Quick Start

```typescript
import { ImageUpload } from '@thrift/image-upload';

const uploader = new ImageUpload({
  defaultProvider: 'supabase',
  providers: {
    supabase: {
      url: 'https://your-project.supabase.co',
      anonKey: 'your-anon-key',
      bucket: 'images',
    },
  },
  defaults: {
    compression: {
      enabled: true,
      quality: 80,
      format: 'webp',
    },
  },
  fallback: {
    enabled: true,
    provider: 'local',
  },
});

// Upload an image with automatic compression
const result = await uploader.upload(buffer, 'photo.jpg', {
  folder: 'avatars',
  contentType: 'image/jpeg',
});

console.log(result.url);
console.log(`Compressed: ${result.compressed}, Ratio: ${result.compressionRatio}%`);
```

## Provider Configuration

### Supabase

```typescript
const uploader = new ImageUpload({
  defaultProvider: 'supabase',
  providers: {
    supabase: {
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!,
      bucket: 'images',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // optional
    },
  },
});
```

### Cloudinary

```typescript
const uploader = new ImageUpload({
  defaultProvider: 'cloudinary',
  providers: {
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      apiSecret: process.env.CLOUDINARY_API_SECRET!,
      folder: 'uploads', // optional
    },
  },
});
```

### AWS S3

```typescript
const uploader = new ImageUpload({
  defaultProvider: 's3',
  providers: {
    s3: {
      region: process.env.AWS_REGION!,
      bucket: process.env.AWS_S3_BUCKET!,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      endpoint: process.env.AWS_S3_ENDPOINT, // optional, for S3-compatible services
      forcePathStyle: false, // optional
    },
  },
});
```

### Local Storage

```typescript
const uploader = new ImageUpload({
  defaultProvider: 'local',
  providers: {
    local: {
      uploadDir: './uploads',
      baseUrl: 'http://localhost:4000',
    },
  },
});
```

## Image Compression

The package automatically compresses images before upload using Sharp:

```typescript
const result = await uploader.upload(buffer, 'photo.jpg', {
  folder: 'avatars',
  contentType: 'image/jpeg',
  compression: {
    enabled: true,
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1920,
    format: 'webp', // Convert to WebP for better compression
  },
});

// Compression results
console.log(`Original size: ${result.originalSize}`);
console.log(`Compressed size: ${result.bytes}`);
console.log(`Compression ratio: ${result.compressionRatio}%`);
```

### Compression Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Enable/disable compression |
| `quality` | `80` | Compression quality (1-100) |
| `maxWidth` | `1920` | Maximum width in pixels |
| `maxHeight` | `1920` | Maximum height in pixels |
| `format` | `webp` | Output format (jpeg, png, webp, avif) |
| `maintainAspectRatio` | `true` | Maintain aspect ratio |

### Compression Utilities

```typescript
import { compressImage, optimizeForWeb, optimizeForMobile } from '@thrift/image-upload';

// Custom compression
const compressed = await compressImage(buffer, {
  quality: 75,
  maxWidth: 1200,
  format: 'webp',
});

// Optimize for web (1200px wide, 75% quality)
const webOptimized = await optimizeForWeb(buffer);

// Optimize for mobile (640px wide, 70% quality)
const mobileOptimized = await optimizeForMobile(buffer);
```

## Fallback Support

Configure automatic fallback to local storage if cloud providers fail:

```typescript
const uploader = new ImageUpload({
  defaultProvider: 'supabase',
  providers: {
    supabase: { /* ... */ },
    local: {
      uploadDir: './uploads',
      baseUrl: 'http://localhost:4000',
    },
  },
  fallback: {
    enabled: true,
    provider: 'local',
  },
});

// If Supabase fails, automatically falls back to local storage
const result = await uploader.upload(buffer, 'photo.jpg');
```

## Retry Logic

Built-in retry mechanism with exponential backoff:

```typescript
const result = await uploader.uploadWithRetry(buffer, 'photo.jpg', {
  folder: 'avatars',
  contentType: 'image/jpeg',
  retries: 3, // Retry up to 3 times
});
```

## API Reference

### `ImageUpload`

#### Constructor

```typescript
new ImageUpload(config: ImageUploadConfig)
```

#### Methods

##### `upload(file, filename, options?)`

Upload a file to the configured provider.

```typescript
const result = await uploader.upload(buffer, 'image.jpg', {
  folder: 'avatars',
  contentType: 'image/jpeg',
  compression: {
    enabled: true,
    quality: 80,
  },
});
```

##### `uploadWithRetry(file, filename, options?)`

Upload with automatic retry on failure.

```typescript
const result = await uploader.uploadWithRetry(buffer, 'image.jpg', {
  retries: 3,
});
```

##### `delete(identifier, options?)`

Delete a file from the provider.

```typescript
await uploader.delete('avatars/image-1234567890-abc123.jpg');
```

##### `getUrl(identifier, options?)`

Get the URL for a file, optionally with transformations.

```typescript
const url = uploader.getUrl('avatars/image-1234567890-abc123.jpg', {
  transformation: {
    width: 200,
    height: 200,
    crop: 'fill',
  },
});
```

##### `uploadWithValidation(file, filename, options?)`

Upload with built-in validation for file type and size.

```typescript
const result = await uploader.uploadWithValidation(buffer, 'image.jpg', {
  folder: 'avatars',
  contentType: 'image/jpeg',
});
```

## Express Middleware

```typescript
import { createUploadMiddleware } from '@thrift/image-upload/middleware';

const uploadMiddleware = createUploadMiddleware(config, {
  fieldName: 'avatar',
  maxFiles: 1,
  folder: 'avatars',
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
});

app.post('/upload', uploadMiddleware, (req, res) => {
  res.json({ url: req.uploadResults.url });
});
```

## Environment Variables

The package can be configured entirely via environment variables:

```bash
# Provider selection
IMAGE_UPLOAD_PROVIDER=supabase

# Defaults
IMAGE_UPLOAD_FOLDER=uploads
IMAGE_UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp
IMAGE_UPLOAD_MAX_SIZE=10485760

# Compression
IMAGE_COMPRESSION_ENABLED=true
IMAGE_COMPRESSION_QUALITY=80
IMAGE_COMPRESSION_MAX_WIDTH=1920
IMAGE_COMPRESSION_MAX_HEIGHT=1920
IMAGE_COMPRESSION_FORMAT=webp

# Fallback
IMAGE_FALLBACK_ENABLED=true
IMAGE_FALLBACK_PROVIDER=local

# Local Storage
LOCAL_UPLOAD_DIR=./uploads
LOCAL_BASE_URL=http://localhost:4000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_BUCKET=images
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=uploads

# AWS S3
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
AWS_S3_ACCESS_KEY_ID=your-access-key
AWS_S3_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_ENDPOINT=https://s3.amazonaws.com
AWS_S3_FORCE_PATH_STYLE=false
```

Then use the environment-based factory:

```typescript
import { createImageUploadFromEnv } from '@thrift/image-upload';

const uploader = createImageUploadFromEnv();
```

## Multiple Providers

You can configure multiple providers and switch between them:

```typescript
const uploader = new ImageUpload({
  defaultProvider: 'supabase',
  providers: {
    supabase: { /* ... */ },
    cloudinary: { /* ... */ },
    s3: { /* ... */ },
    local: { /* ... */ },
  },
  fallback: {
    enabled: true,
    provider: 'local',
  },
});

// Use default provider
await uploader.upload(buffer, 'image.jpg');

// Use specific provider
await uploader.upload(buffer, 'image.jpg', { provider: 'cloudinary' });
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  UploadProvider,
  UploadOptions,
  UploadResult,
  DeleteResult,
  ImageUploadConfig,
  ProviderName,
  CompressionOptions,
  CompressionResult,
} from '@thrift/image-upload';
```

## License

MIT
