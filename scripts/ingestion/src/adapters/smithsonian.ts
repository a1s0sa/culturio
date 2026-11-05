import { classifyAfricanGeography, normalizedArtifactSchema, parseHistoricalDate, type DiscoveredRecord, type NormalizedArtifact, type SourceAdapter, type SourceCheckpoint } from '@culturio/shared';
import { z } from 'zod';
import { HttpError, retryAfterMilliseconds, withRetry } from '../infrastructure/retry.js';

const recordSchema = z.object({ id: z.string(), title: z.string().optional(), url: z.string().optional(), content: z.record(z.string(), z.unknown()).default({}) }).passthrough();
const searchSchema = z.object({ response: z.object({ rowCount: z.number().optional(), rows: z.array(recordSchema) }) });
type SmithsonianRecord = z.infer<typeof recordSchema>;

function stringsAt(value: unknown, keys: string[]): string[] {
  let cursor: unknown = value;
  for (const key of keys) cursor = typeof cursor === 'object' && cursor !== null ? (cursor as Record<string, unknown>)[key] : undefined;
  if (!Array.isArray(cursor)) return typeof cursor === 'string' ? [cursor] : [];
  return cursor.flatMap((item) => typeof item === 'string' ? [item] : typeof item === 'object' && item !== null ? Object.values(item).filter((entry): entry is string => typeof entry === 'string') : []);
}
function first(...values: (string | undefined)[]): string | null { return values.find((value) => value?.trim())?.trim() ?? null; }

export class SmithsonianAdapter implements SourceAdapter<SmithsonianRecord> {
  readonly source = 'smithsonian' as const;
  constructor(private readonly apiKey: string, private readonly fetcher: typeof fetch = fetch) {}
  async *discover(checkpoint: SourceCheckpoint, signal?: AbortSignal): AsyncIterable<DiscoveredRecord> {
    let offset = checkpoint.offset ?? 0;
    while (true) {
      const url = this.url('/search', { q: 'Africa online_media_type:Images', start: String(offset), rows: '100' });
      const response = searchSchema.parse(await this.getJson(url, signal)).response;
      if (!response.rows.length) return;
      for (const row of response.rows) yield { source: this.source, externalId: row.id, checkpoint: { offset: offset + response.rows.indexOf(row) + 1 } };
      offset += response.rows.length;
      if (response.rowCount !== undefined && offset >= response.rowCount) return;
    }
  }
  async fetchRecord(id: string, signal?: AbortSignal): Promise<SmithsonianRecord> {
    const payload = await this.getJson(this.url(`/content/${encodeURIComponent(id)}`), signal) as { response?: unknown };
    return recordSchema.parse(payload.response ?? payload);
  }
  async normalize(record: SmithsonianRecord): Promise<NormalizedArtifact> {
    const content = record.content;
    const indexed = (content.indexedStructured as Record<string, unknown> | undefined) ?? {};
    const places = [...stringsAt(indexed, ['place']), ...stringsAt(indexed, ['culture'])];
    const classification = classifyAfricanGeography(places);
    if (classification === 'not-african') throw new Error('Source metadata does not establish African origin');
    const freetext = (content.freetext as Record<string, unknown> | undefined) ?? {};
    const dates = stringsAt(freetext, ['date']); const dateDisplay = dates[0] ?? null; const parsed = parseHistoricalDate(dateDisplay);
    const media = stringsAt(content, ['descriptiveNonRepeating','online_media','media']).filter((value) => /^https:\/\//.test(value) && /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(value));
    const usage = stringsAt(content, ['descriptiveNonRepeating','online_media','usage']).join(' ');
    const cc0 = /CC0|public domain/i.test(usage);
    const title = first(record.title, stringsAt(content, ['descriptiveNonRepeating','title','content'])[0]) ?? 'Untitled';
    const sourceUrl = first(record.url, stringsAt(content, ['descriptiveNonRepeating','record_link'])[0]) ?? `https://www.si.edu/object/${encodeURIComponent(record.id)}`;
    return normalizedArtifactSchema.parse({ source: this.source, externalId: record.id, sourceUrl, accessionNumber: stringsAt(indexed, ['identifier'])[0] ?? null, title, alternativeNames: [], description: stringsAt(freetext, ['notes'])[0] ?? null, artifactType: stringsAt(indexed, ['object_type'])[0] ?? null, cultures: stringsAt(indexed, ['culture']), civilizations: [], origin: places.join(', ') || null, historicalPeriod: null, earliestYear: parsed.earliest, latestYear: parsed.latest, dateDisplay, dateUncertain: parsed.uncertain, materials: stringsAt(indexed, ['physical_description']), dimensions: stringsAt(freetext, ['physicalDescription'])[0] ?? null, images: [...new Set(media)].map((sourceUrl) => ({ sourceUrl, width: null, height: null, mimeType: null, license: { identifier: cc0 ? 'CC0-1.0' : null, url: cc0 ? 'https://creativecommons.org/publicdomain/zero/1.0/' : null, attribution: 'Smithsonian Institution', redistributionAllowed: cc0, metadataRights: usage || null } })), sourceAttribution: 'Smithsonian Institution', metadataLicense: 'CC0-1.0', raw: record, geographyConfidence: classification === 'african' ? 'confirmed' : 'ambiguous' });
  }
  private url(path: string, params: Record<string, string> = {}): URL { const url = new URL(`https://api.si.edu/openaccess/api/v1.0${path}`); url.searchParams.set('api_key', this.apiKey); Object.entries(params).forEach(([key,value]) => url.searchParams.set(key,value)); return url; }
  private async getJson(url: URL, signal?: AbortSignal): Promise<unknown> { return withRetry(async () => { const response = await this.fetcher(url, { signal, headers: { accept: 'application/json' } }); if (!response.ok) throw new HttpError(`Smithsonian API returned ${response.status}`, response.status, retryAfterMilliseconds(response)); return response.json(); }, 5, signal); }
}
