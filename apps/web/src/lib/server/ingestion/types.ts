import { MetAdapter } from '../../../../../../scripts/ingestion/src/adapters/met.js';
import { SmithsonianAdapter } from '../../../../../../scripts/ingestion/src/adapters/smithsonian.js';
import type { NormalizedArtifact, SourceName } from '@culturio/shared';

export interface IngestionJob {
  id: string;
  runId: string;
  source: SourceName;
  externalId: string;
}

export interface IngestionEnv extends Cloudflare.Env {
  INGEST_QUEUE: Queue<IngestionJob>;
  INGEST_DLQ: Queue<IngestionJob>;
  INGEST_WORKFLOW: Workflow<IngestionJob>;
  IMAGES: ImagesBinding;
  SMITHSONIAN_API_KEY?: string;
  INGESTION_TRIGGER_SECRET?: string;
}

export function adapterFor(env: IngestionEnv, source: SourceName) {
  const fetcher = rateLimitedFetcher(env, source);
  if (source === 'met') return new MetAdapter(fetcher);
  if (!env.SMITHSONIAN_API_KEY) throw new Error('SMITHSONIAN_API_KEY is not configured');
  return new SmithsonianAdapter(env.SMITHSONIAN_API_KEY, fetcher);
}

export async function retrieveAndNormalize(
  env: IngestionEnv,
  source: SourceName,
  id: string
): Promise<NormalizedArtifact> {
  const fetcher = rateLimitedFetcher(env, source);
  if (source === 'met') {
    const adapter = new MetAdapter(fetcher);
    return adapter.normalize(await adapter.fetchRecord(id));
  }
  if (!env.SMITHSONIAN_API_KEY) throw new Error('SMITHSONIAN_API_KEY is not configured');
  const adapter = new SmithsonianAdapter(env.SMITHSONIAN_API_KEY, fetcher);
  return adapter.normalize(await adapter.fetchRecord(id));
}

function rateLimitedFetcher(env: IngestionEnv, source: SourceName): typeof fetch {
  const interval = source === 'met' ? 350 : 1000;
  return async (input, init) => {
    const now = Date.now();
    const slot = await env.DB.prepare(
      `INSERT INTO ingestion_discovery_state (source,offset,next_request_at,updated_at)
       VALUES (?,0,?,?)
       ON CONFLICT(source) DO UPDATE SET
         next_request_at=MAX(ingestion_discovery_state.next_request_at, ?)+?,
         updated_at=excluded.updated_at
       RETURNING next_request_at-? AS request_at`
    )
      .bind(source, now + interval, now, now, now, interval, interval)
      .first<{ request_at: number }>();
    const wait = (slot?.request_at ?? now) - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    return fetch(input, init);
  };
}
