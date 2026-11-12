import { sourceNameSchema, type SourceCheckpoint } from '@culturio/shared';
import type { IngestionEnv, IngestionJob } from './types.js';
import { adapterFor } from './types.js';

const MAX_DISCOVERY_JOBS = 20;
const MAX_DISCOVERY_SCAN = 20;
const REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const FAILED_JOB_COOLDOWN_MS = 6 * 60 * 60 * 1000;

export async function discoverAndQueue(
  env: IngestionEnv,
  sourceInput: unknown,
  limitInput: unknown
) {
  const source = sourceNameSchema.parse(sourceInput);
  const limit = Math.min(Math.max(Number(limitInput) || 100, 1), MAX_DISCOVERY_JOBS);
  const runId = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO ingestion_runs (id,source,status,started_at,discovered,processed,inserted,updated,skipped,rejected,images_processed,errors,created_at,updated_at)
     VALUES (?,?,'running',?,0,0,0,0,0,0,0,0,?,?)`
  )
    .bind(runId, source, now, now, now)
    .run();

  try {
    const state = await env.DB.prepare(
      'SELECT offset FROM ingestion_discovery_state WHERE source = ?'
    )
      .bind(source)
      .first<{ offset: number }>();
    const adapter = adapterFor(env, source);
    const queueMessages: { body: IngestionJob }[] = [];
    let checkpoint: SourceCheckpoint = { offset: state?.offset ?? 0 };
    let discovered = 0;
    let scanned = 0;
    let exhausted = true;

    for await (const record of adapter.discover(checkpoint)) {
      checkpoint = record.checkpoint;
      scanned += 1;
      const existing = await env.DB.prepare(
        `SELECT
          (SELECT last_fetched_at FROM artifact_sources WHERE institution=? AND external_id=? LIMIT 1) AS last_fetched_at,
          (SELECT MAX(updated_at) FROM review_records WHERE source=? AND external_id=? AND status='open') AS open_review_at,
          (SELECT MAX(updated_at) FROM ingestion_jobs WHERE source=? AND external_id=? AND status='failed') AS last_failed_at`
      )
        .bind(source, record.externalId, source, record.externalId, source, record.externalId)
        .first<{
          last_fetched_at: number | null;
          open_review_at: number | null;
          last_failed_at: number | null;
        }>();
      const shouldRefresh =
        existing?.last_fetched_at == null || now - existing.last_fetched_at >= REFRESH_AFTER_MS;
      const pendingReview = existing?.open_review_at != null;
      const recentFailure =
        existing?.last_failed_at != null && now - existing.last_failed_at < FAILED_JOB_COOLDOWN_MS;
      if (shouldRefresh && !pendingReview && !recentFailure) {
        const id = await stableId(`${runId}:${source}:${record.externalId}`);
        const job = { id, runId, source, externalId: record.externalId } satisfies IngestionJob;
        await env.DB.prepare(
          `INSERT INTO ingestion_jobs (id,run_id,source,external_id,status,created_at,updated_at)
         VALUES (?, ?, ?, ?, 'queued', ?, ?) ON CONFLICT(run_id,source,external_id) DO NOTHING`
        )
          .bind(id, runId, source, record.externalId, now, now)
          .run();
        queueMessages.push({ body: job });
        discovered += 1;
      }
      if (discovered >= limit || scanned >= MAX_DISCOVERY_SCAN) {
        exhausted = false;
        break;
      }
    }
    if (queueMessages.length) await env.INGEST_QUEUE.sendBatch(queueMessages);

    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO ingestion_discovery_state (source,offset,updated_at) VALUES (?, ?, ?)
       ON CONFLICT(source) DO UPDATE SET offset=excluded.offset,updated_at=excluded.updated_at`
      ).bind(source, exhausted ? 0 : (checkpoint.offset ?? 0), now),
      env.DB.prepare('UPDATE ingestion_runs SET discovered = ?, updated_at = ? WHERE id = ?').bind(
        discovered,
        now,
        runId
      ),
      env.DB.prepare(
        `UPDATE ingestion_runs SET
          status=CASE WHEN processed>=? THEN 'completed' ELSE 'running' END,
          ended_at=CASE WHEN processed>=? THEN ? ELSE NULL END,
          updated_at=? WHERE id=?`
      ).bind(discovered, discovered, now, now, runId)
    ]);
    console.info(
      JSON.stringify({ event: 'ingestion.discovery.published', runId, source, discovered, scanned })
    );
    return {
      runId,
      source,
      discovered,
      scanned,
      checkpoint: { ...checkpoint, offset: exhausted ? 0 : (checkpoint.offset ?? 0) }
    };
  } catch (error) {
    await env.DB.prepare(
      `UPDATE ingestion_runs SET status='failed',ended_at=?,errors=errors+1,report=?,updated_at=? WHERE id=?`
    )
      .bind(Date.now(), JSON.stringify({ failure: String(error) }), Date.now(), runId)
      .run()
      .catch(() => undefined);
    throw error;
  }
}

async function stableId(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return `job_${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 24)}`;
}
