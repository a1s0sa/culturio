import { afterEach, describe, expect, it, vi } from 'vitest';
import { discoverAndQueue } from './discovery.js';

describe('ingestion discovery', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('publishes ID-only jobs in bounded batches and advances the source checkpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith('/search')) {
          return Response.json({ total: 2, objectIDs: [42, 43] });
        }
        const objectID = Number(url.pathname.split('/').at(-1));
        return Response.json({
          objectID,
          isPublicDomain: true,
          primaryImage: `https://images.metmuseum.org/${objectID}.jpg`,
          additionalImages: [],
          objectURL: `https://www.metmuseum.org/art/collection/search/${objectID}`,
          title: 'Artifact',
          objectName: 'Artifact',
          culture: 'Benin',
          country: 'Nigeria',
          region: '',
          subregion: '',
          locale: '',
          period: '',
          dynasty: '',
          objectDate: '',
          medium: '',
          dimensions: '',
          creditLine: '',
          repository: '',
          tags: []
        });
      })
    );
    const bound: unknown[][] = [];
    const db = {
      prepare: vi.fn((sql: string) => ({
        bind: (...args: unknown[]) => {
          bound.push(args);
          return {
            first: async () => (sql.includes('SELECT offset') ? { offset: 8 } : null),
            run: async () => ({ success: true })
          };
        }
      })),
      batch: vi.fn().mockResolvedValue([])
    };
    const sendBatch = vi.fn().mockResolvedValue(undefined);
    const media = { put: vi.fn().mockResolvedValue(undefined), delete: vi.fn() };
    const result = await discoverAndQueue(
      { DB: db, MEDIA: media, INGEST_QUEUE: { sendBatch } } as never,
      'met',
      1
    );

    expect(result.discovered).toBe(1);
    expect(result.checkpoint.offset).toBe(9);
    expect(sendBatch).toHaveBeenCalledOnce();
    expect(sendBatch.mock.calls[0][0]).toHaveLength(1);
    expect(sendBatch.mock.calls[0][0][0].body).toMatchObject({ source: 'met', externalId: '42' });
    expect(sendBatch.mock.calls[0][0][0].body.id).toMatch(/^job_[a-f0-9]{24}$/);
    expect(db.batch).toHaveBeenCalledOnce();
  });
});
