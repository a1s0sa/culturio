import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { processImage } from '../src/media/process.js';

describe('image processing', () => {
  it('does not enlarge low-resolution originals', async () => {
    const input = await sharp({ create:{ width:100,height:50,channels:3,background:'#805533' } }).png().toBuffer();
    const result = await processImage(input);
    expect(result.variants.every((variant) => variant.width === 100 && variant.height === 50)).toBe(true);
    expect(result.variants.every((variant) => variant.mimeType === 'image/webp')).toBe(true);
  });
  it('rejects invalid image bytes', async () => { await expect(processImage(Buffer.from('not an image'))).rejects.toThrow(); });
});
