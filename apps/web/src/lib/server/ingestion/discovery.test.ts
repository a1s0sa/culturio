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
      { DB: db, MEDIA: media, UNPUBLISHED_MEDIA: media, INGEST_QUEUE: { sendBatch } } as never,
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

  it('does not queue Smithsonian records with no redistributable image', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith('/search')) {
          return Response.json({
            response: {
              rowCount: 1,
              rows: [
                { id: 'si-1', title: 'Mask', url: 'https://www.si.edu/object/si-1', content: {} }
              ]
            }
          });
        }
        return Response.json({
          response: {
            id: 'si-1',
            title: 'Mask',
            url: 'https://www.si.edu/object/si-1',
            content: {
              indexedStructured: { place: ['Nigeria'], culture: ['Yoruba'] },
              descriptiveNonRepeating: {
                online_media: {
                  media: ['https://ids.si.edu/abc/object.jpg'],
                  usage: 'All rights reserved'
                }
              }
            }
          }
        });
      })
    );
    const db = {
      prepare: vi.fn((sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: async () => null,
          run: async () => ({ success: true })
        })
      })),
      batch: vi.fn().mockResolvedValue([])
    };
    const sendBatch = vi.fn().mockResolvedValue(undefined);
    const unpublished = { put: vi.fn(), delete: vi.fn() };

    const result = await discoverAndQueue(
      {
        DB: db,
        UNPUBLISHED_MEDIA: unpublished,
        INGEST_QUEUE: { sendBatch },
        SMITHSONIAN_API_KEY: 'test-key'
      } as never,
      'smithsonian',
      20
    );

    expect(result).toMatchObject({ discovered: 0, scanned: 1, rejected: 1 });
    expect(sendBatch).not.toHaveBeenCalled();
    expect(unpublished.put).not.toHaveBeenCalled();
  });

  it('caps each request at 20 records and resumes from its checkpoint', async () => {
    const rows = Array.from({ length: 21 }, (_, index) => ({
      id: `si-${index + 1}`,
      title: 'Mask',
      url: `https://www.si.edu/object/si-${index + 1}`,
      content: {}
    }));
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith('/search')) {
          const start = Number(url.searchParams.get('start') ?? 0);
          return Response.json({ response: { rowCount: rows.length, rows: rows.slice(start) } });
        }

        const id = url.pathname.split('/').at(-1)!;
        return Response.json({
          response: {
            id,
            title: 'Mask',
            url: `https://www.si.edu/object/${id}`,
            content: {
              indexedStructured: { place: ['Nigeria'], culture: ['Yoruba'] },
              descriptiveNonRepeating: {
                online_media: {
                  media: [`https://ids.si.edu/${id}.jpg`],
                  usage: id === 'si-21' ? 'CC0' : 'All rights reserved'
                }
              }
            }
          }
        });
      })
    );
    let checkpointOffset = 0;
    const db = {
      prepare: vi.fn((sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: async () =>
            sql.includes('SELECT offset') ? { offset: checkpointOffset, cursor: null } : null,
          run: async () => ({ success: true })
        })
      })),
      batch: vi.fn().mockResolvedValue([])
    };
    const sendBatch = vi.fn().mockResolvedValue(undefined);
    const unpublished = { put: vi.fn().mockResolvedValue(undefined), delete: vi.fn() };

    const env = {
      DB: db,
      UNPUBLISHED_MEDIA: unpublished,
      INGEST_QUEUE: { sendBatch },
      SMITHSONIAN_API_KEY: 'test-key'
    } as never;
    const firstResult = await discoverAndQueue(env, 'smithsonian', 20);

    expect(firstResult).toMatchObject({
      discovered: 0,
      scanned: 20,
      rejected: 20,
      exhausted: false,
      checkpoint: { offset: 20 }
    });
    expect(sendBatch).not.toHaveBeenCalled();
    checkpointOffset = firstResult.checkpoint.offset;

    const result = await discoverAndQueue(env, 'smithsonian', 1);

    expect(result).toMatchObject({ discovered: 1, scanned: 1, rejected: 0, exhausted: false });
    expect(result.checkpoint.offset).toBe(21);
    expect(sendBatch).toHaveBeenCalledOnce();
    expect(sendBatch.mock.calls[0][0][0].body.externalId).toBe('si-21');
  });
});
