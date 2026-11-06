import { createHash } from 'node:crypto';

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/tiff': 'tiff',
  'image/gif': 'gif',
  'image/avif': 'avif'
};
export function contentHash(buffer: Uint8Array): string {
  return createHash('sha256').update(buffer).digest('hex');
}
export function originalExtension(mimeType: string): string {
  const value = extensions[mimeType];
  if (!value) throw new Error(`Unsupported original MIME type: ${mimeType}`);
  return value;
}
export function objectPrefix(artifactId: string, hash: string): string {
  return `artifacts/${artifactId}/${hash}`;
}
