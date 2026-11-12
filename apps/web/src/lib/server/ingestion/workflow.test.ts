import { afterEach, describe, expect, it, vi } from 'vitest';
import { IngestionWorkflow } from './workflow.js';

const metRecord = {
  objectID: 42,
  isPublicDomain: true,
  primaryImage: 'https://images.metmuseum.org/object.jpg',
  objectURL: 'https://www.metmuseum.org/art/collection/search/42',
  title: 'Yoruba mask',
  culture: 'Yoruba',
  country: 'Nigeria'
};

function durableSteps() {
  const completed = new Map<string, unknown>();
  return {
    do: async (name: string, configOrCallback: unknown, callback?: () => Promise<unknown>) => {
      if (completed.has(name)) return completed.get(name);
      const run = typeof configOrCallback === 'function' ? configOrCallback : callback;
      const result = await (run as () => Promise<unknown>)();
      completed.set(name, result);
      return result;
    }
  };
}

function setup(failPersistOnce = false) {
  const objects = new Map<string, { value: unknown; size: number }>();
  const imageBytes = new Uint8Array([1, 2, 3, 4]);
  const statements: string[] = [];
  let shouldFailPersist = failPersistOnce;
  const db = {
    prepare(sql: string) {
      statements.push(sql);
      return {
        bind: (..._params: unknown[]) => ({
          sql,
          first: async () => (sql.includes('SELECT record_hash') ? null : null),
          run: async () => ({ success: true })
        })
      };
    },
    async batch(batch: { sql: string }[]) {
      if (shouldFailPersist && batch[0]?.sql.includes('INSERT INTO artifacts')) {
        shouldFailPersist = false;
        throw new Error('temporary D1 failure');
      }
      return batch.map(() => ({ success: true }));
    }
  };
  const env = {
    DB: db,
    MEDIA: {
      async put(key: string, value: unknown) {
        const size =
          typeof value === 'string'
            ? new TextEncoder().encode(value).byteLength
            : imageBytes.byteLength;
        objects.set(key, { value, size });
        return { size };
      },
      async get(key: string) {
        const object = objects.get(key);
        if (!object) return null;
        return { json: async () => JSON.parse(String(object.value)) };
      },
      async head(key: string) {
        const object = objects.get(key);
        return object ? { size: object.size } : null;
      },
      async delete(key: string) {
        objects.delete(key);
      }
    },
    IMAGES: {
      info: vi.fn().mockResolvedValue({
        format: 'image/jpeg',
        width: 1000,
        height: 500,
        fileSize: imageBytes.length
      }),
      input: vi.fn(() => ({
        transform: () => ({
          output: async () => ({ response: async () => new Response(imageBytes) })
        })
      }))
    },
    INGEST_DLQ: { send: vi.fn() }
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      return url.includes('collectionapi.metmuseum.org')
        ? Response.json(metRecord)
        : new Response(imageBytes, { headers: { 'content-type': 'image/jpeg' } });
    })
  );
  const workflow = new IngestionWorkflow({} as never, env as never);
  const event = {
    payload: {
      id: 'job_0123456789abcdef01234567',
      runId: '00000000-0000-4000-8000-000000000000',
      source: 'met' as const,
      externalId: '42'
    }
  } as never;
  return { workflow, event, env, steps: durableSteps(), objects, statements };
}

describe('IngestionWorkflow', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('stores original and Cloudflare Images variants, then persists metadata to D1', async () => {
    const { workflow, event, env, steps, objects, statements } = setup();
    await workflow.run(event, steps as never);
    expect([...objects.keys()].some((key) => key.endsWith('/original.jpg'))).toBe(true);
    expect([...objects.keys()].some((key) => key.endsWith('/320.webp'))).toBe(true);
    expect(env.IMAGES.input).toHaveBeenCalledTimes(3);
    expect(statements.some((sql) => sql.includes('INSERT INTO artifact_sources'))).toBe(true);
  });

  it('resumes after a D1 failure without downloading or transforming successful image work again', async () => {
    const { workflow, event, env, steps } = setup(true);
    await expect(workflow.run(event, steps as never)).rejects.toThrow('temporary D1 failure');
    const downloadCalls = vi.mocked(fetch).mock.calls.length;
    await workflow.run(event, steps as never);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(downloadCalls);
    expect(env.IMAGES.input).toHaveBeenCalledTimes(3);
  });

  it('sends permanently invalid source records to the dead-letter queue', async () => {
    const { workflow, event, env, steps } = setup();
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ objectID: 'invalid' }));
    await expect(workflow.run(event, steps as never)).rejects.toThrow();
    expect(env.INGEST_DLQ.send).toHaveBeenCalledOnce();
  });
});
