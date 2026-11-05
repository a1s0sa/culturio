import { classifyAfricanGeography, normalizedArtifactSchema, parseHistoricalDate, type DiscoveredRecord, type NormalizedArtifact, type SourceAdapter, type SourceCheckpoint } from '@culturio/shared';
import { z } from 'zod';
import { HttpError, retryAfterMilliseconds, withRetry } from '../infrastructure/retry.js';

const searchSchema = z.object({ total: z.number(), objectIDs: z.array(z.number()).nullable().default([]) });
const metObjectSchema = z.object({
  objectID: z.number(), isPublicDomain: z.boolean().default(false), primaryImage: z.string().default(''), additionalImages: z.array(z.string()).default([]),
  objectURL: z.string().url(), accessionNumber: z.string().default(''), title: z.string().default('Untitled'), objectName: z.string().default(''),
  culture: z.string().default(''), country: z.string().default(''), region: z.string().default(''), subregion: z.string().default(''),
  locale: z.string().default(''), period: z.string().default(''), dynasty: z.string().default(''), objectDate: z.string().default(''),
  objectBeginDate: z.number().nullable().optional(), objectEndDate: z.number().nullable().optional(), medium: z.string().default(''),
  dimensions: z.string().default(''), creditLine: z.string().default(''), repository: z.string().default(''),
  tags: z.array(z.object({ term: z.string() })).nullable().default([])
}).passthrough();
type MetObject = z.infer<typeof metObjectSchema>;

export class MetAdapter implements SourceAdapter<MetObject> {
  readonly source = 'met' as const;
  constructor(private readonly fetcher: typeof fetch = fetch) {}
  async *discover(checkpoint: SourceCheckpoint, signal?: AbortSignal): AsyncIterable<DiscoveredRecord> {
    let offset = checkpoint.offset ?? 0;
    while (true) {
      const url = new URL('https://collectionapi.metmuseum.org/public/collection/v1.1/search');
      Object.entries({ q: 'African', hasImages: 'true', offset: String(offset), limit: '200' }).forEach(([key, value]) => url.searchParams.set(key, value));
      const payload = searchSchema.parse(await this.getJson(url, signal));
      if (!payload.objectIDs.length) return;
      for (const id of payload.objectIDs) yield { source: this.source, externalId: String(id), checkpoint: { offset: offset + payload.objectIDs.indexOf(id) + 1 } };
      offset += payload.objectIDs.length;
      if (offset >= payload.total || offset >= 10_000) return;
    }
  }
  async fetchRecord(id: string, signal?: AbortSignal): Promise<MetObject> {
    return metObjectSchema.parse(await this.getJson(new URL(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${encodeURIComponent(id)}`), signal));
  }
  async normalize(record: MetObject): Promise<NormalizedArtifact> {
    const geography = [record.country, record.region, record.subregion, record.locale, record.culture].filter(Boolean);
    const classification = classifyAfricanGeography(geography);
    if (classification === 'not-african') throw new Error('Source metadata does not establish African origin');
    const parsed = parseHistoricalDate(record.objectDate);
    const earliestYear = record.objectBeginDate ?? parsed.earliest;
    const latestYear = record.objectEndDate ?? parsed.latest;
    const images = [record.primaryImage, ...record.additionalImages].filter(Boolean).map((sourceUrl) => ({ sourceUrl, width: null, height: null, mimeType: null, license: { identifier: record.isPublicDomain ? 'CC0-1.0' : null, url: record.isPublicDomain ? 'https://creativecommons.org/publicdomain/zero/1.0/' : null, attribution: record.creditLine || 'The Metropolitan Museum of Art', redistributionAllowed: record.isPublicDomain, metadataRights: 'The Metropolitan Museum of Art Open Access' } }));
    return normalizedArtifactSchema.parse({ source: this.source, externalId: String(record.objectID), sourceUrl: record.objectURL, accessionNumber: record.accessionNumber || null, title: record.title || 'Untitled', alternativeNames: [], description: null, artifactType: record.objectName || null, cultures: record.culture ? [record.culture] : [], civilizations: record.dynasty ? [record.dynasty] : [], origin: geography.join(', ') || null, historicalPeriod: record.period || null, earliestYear, latestYear, dateDisplay: record.objectDate || null, dateUncertain: parsed.uncertain, materials: record.medium ? record.medium.split(/[,;]/).map((v) => v.trim()).filter(Boolean) : [], dimensions: record.dimensions || null, images, sourceAttribution: record.creditLine || record.repository || null, metadataLicense: 'CC0-1.0', raw: record, geographyConfidence: classification === 'african' ? 'confirmed' : 'ambiguous' });
  }
  private async getJson(url: URL, signal?: AbortSignal): Promise<unknown> {
    return withRetry(async () => { const response = await this.fetcher(url, { signal, headers: { accept: 'application/json', 'user-agent': 'Culturio/0.1 (+https://github.com/culturio)' } }); if (!response.ok) throw new HttpError(`Met API returned ${response.status}`, response.status, retryAfterMilliseconds(response)); return response.json(); }, 5, signal);
  }
}
