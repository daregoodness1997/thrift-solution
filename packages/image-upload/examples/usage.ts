import { ImageUpload, createImageUploadFromEnv } from '@thrift/image-upload';

// Example 1: Direct configuration
async function exampleDirectConfig() {
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
      folder: 'uploads',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Upload from Buffer
  const imageBuffer = Buffer.from('base64-data');
  const result = await uploader.upload(imageBuffer, 'photo.jpg', {
    folder: 'avatars',
    contentType: 'image/jpeg',
    transformation: {
      width: 800,
      height: 600,
      quality: 80,
    },
  });

  console.log('Uploaded:', result.url);

  // Get URL with transformations
  const thumbnailUrl = uploader.getUrl(result.publicId!, {
    transformation: {
      width: 200,
      height: 200,
      crop: 'fill',
    },
  });

  console.log('Thumbnail:', thumbnailUrl);

  // Delete the file
  await uploader.delete(result.publicId!);
}

// Example 2: Using environment variables
async function exampleEnvConfig() {
  const uploader = createImageUploadFromEnv();

  const result = await uploader.upload(buffer, 'image.png');
  console.log(result);
}

// Example 3: Using with Express middleware
async function exampleExpressMiddleware() {
  const { createUploadMiddleware } = await import('@thrift/image-upload/middleware');

  const uploadMiddleware = createUploadMiddleware(
    {
      defaultProvider: 'cloudinary',
      providers: {
        cloudinary: {
          cloudName: 'your-cloud-name',
          apiKey: 'your-api-key',
          apiSecret: 'your-api-secret',
        },
      },
    },
    {
      fieldName: 'avatar',
      maxFiles: 1,
      folder: 'avatars',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSize: 5 * 1024 * 1024,
    }
  );

  // In your Express route:
  // app.post('/upload', uploadMiddleware, (req, res) => {
  //   res.json({ url: req.uploadResults.url });
  // });
}

// Example 4: Using multiple providers
async function exampleMultipleProviders() {
  const uploader = new ImageUpload({
    defaultProvider: 'supabase',
    providers: {
      supabase: {
        url: 'https://your-project.supabase.co',
        anonKey: 'your-anon-key',
        bucket: 'images',
      },
      cloudinary: {
        cloudName: 'your-cloud-name',
        apiKey: 'your-api-key',
        apiSecret: 'your-api-secret',
      },
    },
  });

  // Upload to Supabase (default)
  const supabaseResult = await uploader.upload(buffer1, 'image1.jpg');

  // Upload to Cloudinary (specific provider)
  const cloudinaryResult = await uploader.upload(buffer2, 'image2.jpg', {
    provider: 'cloudinary',
  });
}
