import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { HttpError, retryAfterMilliseconds, withRetry } from '../infrastructure/retry.js';

export interface DownloadOptions { maxBytes: number; timeoutMs: number; maxRedirects?: number; fetcher?: typeof fetch; }
const allowedTypes = new Set(['image/jpeg','image/png','image/webp','image/tiff','image/gif','image/avif']);

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) { const [a = 0,b = 0] = address.split('.').map(Number); return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168); }
  const normalized = address.toLowerCase();
  return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
}
async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== 'https:') throw new Error('Only HTTPS media URLs are allowed');
  if (url.username || url.password) throw new Error('Media URLs must not include credentials');
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error('Media URL resolves to a private or reserved address');
}

export async function downloadImage(input: string, options: DownloadOptions, signal?: AbortSignal): Promise<{ buffer: Buffer; mimeType: string; finalUrl: string }> {
  const fetcher = options.fetcher ?? fetch; let current = new URL(input); const redirects = options.maxRedirects ?? 4;
  for (let redirect = 0; redirect <= redirects; redirect += 1) {
    await assertPublicUrl(current);
    const response = await withRetry(async () => {
      const timeout = AbortSignal.timeout(options.timeoutMs); const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
      const result = await fetcher(current, { redirect: 'manual', signal: combined, headers: { accept: 'image/*', 'user-agent': 'Culturio/0.1' } });
      if (result.status === 429 || result.status >= 500) throw new HttpError(`Image host returned ${result.status}`, result.status, retryAfterMilliseconds(result));
      return result;
    }, 4, signal);
    if (response.status >= 300 && response.status < 400) { const location = response.headers.get('location'); if (!location || redirect === redirects) throw new Error('Media redirect limit exceeded'); current = new URL(location, current); continue; }
    if (!response.ok) throw new Error(`Image download failed (${response.status})`);
    const declaredLength = Number(response.headers.get('content-length') ?? 0); if (declaredLength > options.maxBytes) throw new Error('Image exceeds maximum byte size');
    const declaredType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''; if (!allowedTypes.has(declaredType)) throw new Error(`Unsupported media type: ${declaredType || 'missing'}`);
    if (!response.body) throw new Error('Image response has no body');
    const chunks: Uint8Array[] = []; let size = 0;
    for await (const chunk of response.body) { size += chunk.length; if (size > options.maxBytes) { await response.body.cancel(); throw new Error('Image exceeds maximum byte size'); } chunks.push(chunk); }
    return { buffer: Buffer.concat(chunks), mimeType: declaredType, finalUrl: current.href };
  }
  throw new Error('Image download failed');
}
