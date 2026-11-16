import { env } from 'cloudflare:workers';
import { json } from '@sveltejs/kit';
import { publishEligibleRunArtifacts } from '$lib/server/ingestion/publish-run';
import type { IngestionEnv } from '$lib/server/ingestion/types';
import type { RequestHandler } from './$types';

const runIdPattern = /^[0-9a-f-]{36}$/i;

export const POST: RequestHandler = async ({ request }) => {
  const secret = env.INGESTION_AUTOPUBLISH_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const input = await request.json().catch(() => null);
  if (!input || typeof input !== 'object' || !('runIds' in input))
    return json({ error: 'Expected runIds' }, { status: 400 });
  const runIds = (input as { runIds?: unknown }).runIds;
  if (
    !Array.isArray(runIds) ||
    runIds.length < 1 ||
    runIds.length > 2 ||
    !runIds.every((id) => typeof id === 'string' && runIdPattern.test(id))
  ) {
    return json({ error: 'runIds must contain one or two valid run IDs' }, { status: 400 });
  }

  try {
    const result = await publishEligibleRunArtifacts(env as unknown as IngestionEnv, runIds);
    return json(result, { status: result.failed.length ? 500 : 200 });
  } catch (cause) {
    const status = cause && typeof cause === 'object' && 'status' in cause ? cause.status : 500;
    const message = cause instanceof Error ? cause.message : 'Publication failed';
    return json({ error: message }, { status: typeof status === 'number' ? status : 500 });
  }
};
