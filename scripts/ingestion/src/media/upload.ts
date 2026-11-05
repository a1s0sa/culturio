import type { S3Client } from '@aws-sdk/client-s3';
import { uploadObject } from '../infrastructure/r2.js';
import { objectPrefix, originalExtension } from './metadata.js';
import type { ProcessedImage } from './process.js';

export async function uploadProcessedImage(client: S3Client, bucket: string, artifactId: string, original: Buffer, originalMime: string, processed: ProcessedImage) {
  const prefix = objectPrefix(artifactId, processed.hash); const originalKey = `${prefix}/original.${originalExtension(originalMime)}`;
  await uploadObject(client, bucket, originalKey, original, originalMime);
  const variants = [];
  const targetWidths = { thumbnail:320, medium:640, large:1280 } as const;
  for (const variant of processed.variants) { const objectKey = `${prefix}/${targetWidths[variant.name]}.webp`; await uploadObject(client, bucket, objectKey, variant.buffer, variant.mimeType); variants.push({ ...variant, buffer: undefined, objectKey }); }
  return { originalKey, variants };
}
