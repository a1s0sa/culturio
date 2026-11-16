import { S3Client } from '@aws-sdk/client-s3';
import type { Config } from '../config.js';

export function createR2Client(config: Config): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID!,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY!
    }
  });
}
