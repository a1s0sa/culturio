import { env } from 'cloudflare:workers';
import { json } from '@sveltejs/kit';
import { discoverAndQueue } from '$lib/server/ingestion/discovery';
import type { IngestionEnv } from '$lib/server/ingestion/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const secret = env.INGESTION_TRIGGER_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object')
    return json({ error: 'Expected a JSON body' }, { status: 400 });
  try {
    const source = (input as { source?: unknown }).source;
    const limit = (input as { limit?: unknown }).limit;
    const sources = source === 'all' ? ['met', 'smithsonian'] : [source];
    if (!sources.every((item) => item === 'met' || item === 'smithsonian')) {
      return json({ error: 'source must be met, smithsonian, or all' }, { status: 400 });
    }
    const result = await Promise.all(
      sources.map((item) => discoverAndQueue(env as unknown as IngestionEnv, item, limit))
    );
    return json({ runs: result }, { status: 202 });
  } catch (error) {
    console.error(JSON.stringify({ event: 'ingestion.discovery.failed', error: String(error) }));
    return json(
      { error: error instanceof Error ? error.message : 'Discovery failed' },
      { status: 503 }
    );
  }
};
