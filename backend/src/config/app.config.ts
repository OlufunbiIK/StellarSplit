import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  swagger: {
    path: process.env.SWAGGER_PATH || '/api/docs',
    title: process.env.SWAGGER_TITLE || 'StellarSplit API',
    description: process.env.SWAGGER_DESCRIPTION || 'API for StellarSplit',
    version: process.env.SWAGGER_VERSION || '1.0.0',
  },
  s3: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.S3_BUCKET_NAME,
    endpoint: process.env.S3_ENDPOINT,
  },
  upload: {
    maxFileSize: process.env.UPLOAD_MAX_FILE_SIZE || '10MB',
    allowedMimeTypes: process.env.UPLOAD_ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,image/webp,application/pdf',
    keyPrefix: process.env.UPLOAD_KEY_PREFIX || 'receipts',
  },
}));
