import { afterEach, describe, expect, it, vi } from 'vitest';
import { discoverAndQueue } from './discovery.js';

describe('ingestion discovery', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('publishes ID-only jobs in bounded batches and advances the source checkpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ total: 2, objectIDs: [42, 43] }))
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
    const result = await discoverAndQueue(
      { DB: db, INGEST_QUEUE: { sendBatch } } as never,
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
