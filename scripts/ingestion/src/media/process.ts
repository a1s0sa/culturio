import sharp from 'sharp';
import { contentHash } from './metadata.js';

export interface ProcessedVariant {
  name: 'thumbnail' | 'medium' | 'large';
  width: number;
  height: number;
  byteSize: number;
  mimeType: 'image/webp';
  buffer: Buffer;
}
export interface ProcessedImage {
  hash: string;
  width: number;
  height: number;
  dominantColor: string;
  variants: ProcessedVariant[];
}
const variantSpecs = [
  { name: 'thumbnail', width: 320 },
  { name: 'medium', width: 640 },
  { name: 'large', width: 1280 }
] as const;

export async function processImage(buffer: Buffer, quality = 82): Promise<ProcessedImage> {
  const source = sharp(buffer, { failOn: 'error', limitInputPixels: 80_000_000 }).rotate();
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height || !metadata.format)
    throw new Error('Image dimensions or decoded format are unavailable');
  if (!['jpeg', 'png', 'webp', 'tiff', 'gif', 'avif'].includes(metadata.format))
    throw new Error(`Unsupported decoded image format: ${metadata.format}`);
  const stats = await source.stats();
  const dominant = stats.dominant;
  const variants = await Promise.all(
    variantSpecs.map(async (spec) => {
      const { data, info } = await sharp(buffer, { failOn: 'error', limitInputPixels: 80_000_000 })
        .rotate()
        .resize({ width: spec.width, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality, effort: 4 })
        .toBuffer({ resolveWithObject: true });
      return {
        name: spec.name,
        width: info.width,
        height: info.height,
        byteSize: info.size,
        mimeType: 'image/webp' as const,
        buffer: data
      };
    })
  );
  return {
    hash: contentHash(buffer),
    width: metadata.autoOrient?.width ?? metadata.width,
    height: metadata.autoOrient?.height ?? metadata.height,
    dominantColor: `#${[dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`,
    variants
  };
}
