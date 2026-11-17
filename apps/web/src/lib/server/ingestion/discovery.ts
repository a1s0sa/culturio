import { sourceNameSchema, type NormalizedArtifact, type SourceCheckpoint } from '@culturio/shared';
import { HttpError } from '@culturio/shared';
import type { IngestionEnv, IngestionJob } from './types.js';
import { adapterFor, retrieveAndNormalize } from './types.js';

const MAX_DISCOVERY_JOBS = 20;
const MAX_DISCOVERY_SCAN = 20;
const REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
const FAILED_JOB_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const ACTIVE_JOB_COOLDOWN_MS = 6 * 60 * 60 * 1000;

export async function discoverAndQueue(
  env: IngestionEnv,
  sourceInput: unknown,
  limitInput: unknown
) {
  const source = sourceNameSchema.parse(sourceInput);
  const limit = Math.min(Math.max(Number(limitInput) || 100, 1), MAX_DISCOVERY_JOBS);
  const runId = crypto.randomUUID();
  const now = Date.now();
  const metadataKeys: string[] = [];
  let queueMessagesSent = false;
  await env.DB.prepare(
    `INSERT INTO ingestion_runs (id,source,status,started_at,discovered,processed,inserted,updated,skipped,rejected,images_processed,errors,created_at,updated_at)
     VALUES (?,?,'running',?,0,0,0,0,0,0,0,0,?,?)`
  )
    .bind(runId, source, now, now, now)
    .run();

  try {
    const state = await env.DB.prepare(
      'SELECT offset, cursor FROM ingestion_discovery_state WHERE source = ?'
    )
      .bind(source)
      .first<{ offset: number; cursor: string | null }>();
    const adapter = adapterFor(env, source);
    const queueMessages: { body: IngestionJob }[] = [];
    let checkpoint: SourceCheckpoint = {
      offset: state?.offset ?? 0,
      ...(state?.cursor ? { cursor: state.cursor } : {})
    };
    let discovered = 0;
    let scanned = 0;
    let rejected = 0;
    let exhausted = true;

    for await (const record of adapter.discover(checkpoint)) {
      checkpoint = record.checkpoint;
      scanned += 1;
      const existing = await env.DB.prepare(
        `SELECT
          (SELECT last_fetched_at FROM artifact_sources WHERE institution=? AND external_id=? LIMIT 1) AS last_fetched_at,
          (SELECT MAX(updated_at) FROM review_records WHERE source=? AND external_id=? AND status='open') AS open_review_at,
          (SELECT MAX(updated_at) FROM ingestion_jobs WHERE source=? AND external_id=? AND status='failed') AS last_failed_at,
          (SELECT MAX(updated_at) FROM ingestion_jobs WHERE source=? AND external_id=? AND status IN ('queued','processing')) AS active_job_at`
      )
        .bind(
          source,
          record.externalId,
          source,
          record.externalId,
          source,
          record.externalId,
          source,
          record.externalId
        )
        .first<{
          last_fetched_at: number | null;
          open_review_at: number | null;
          last_failed_at: number | null;
          active_job_at: number | null;
        }>();
      const shouldRefresh =
        existing?.last_fetched_at == null || now - existing.last_fetched_at >= REFRESH_AFTER_MS;
      const pendingReview = existing?.open_review_at != null;
      const recentFailure =
        existing?.last_failed_at != null && now - existing.last_failed_at < FAILED_JOB_COOLDOWN_MS;
      const recentActiveJob =
        existing?.active_job_at != null && now - existing.active_job_at < ACTIVE_JOB_COOLDOWN_MS;
      if (shouldRefresh && !pendingReview && !recentFailure && !recentActiveJob) {
        const id = await stableId(`${runId}:${source}:${record.externalId}`);
        const job = { id, runId, source, externalId: record.externalId } satisfies IngestionJob;
        let artifact: NormalizedArtifact;
        try {
          artifact = await retrieveAndNormalize(env, source, record.externalId);
        } catch (error) {
          const reasonCode = rejectionCode(error);
          if (!reasonCode) throw error;
          await recordRejection(env, runId, source, record.externalId, reasonCode, String(error));
          rejected += 1;
          if (scanned >= MAX_DISCOVERY_SCAN) {
            exhausted = false;
            break;
          }
          continue;
        }
        const hasRedistributableImage = artifact.images.some(
          (image) => image.license.redistributionAllowed
        );
        if (artifact.geographyConfidence !== 'confirmed' || !hasRedistributableImage) {
          const reasonCode =
            artifact.geographyConfidence === 'ambiguous'
              ? 'ambiguous_geography'
              : artifact.images.length === 0
                ? 'no_images'
                : 'no_redistributable_images';
          await recordRejection(
            env,
            runId,
            source,
            record.externalId,
            reasonCode,
            reasonCode === 'ambiguous_geography'
              ? 'Source metadata does not clearly establish African origin'
              : reasonCode === 'no_images'
                ? 'Source metadata record has no images'
                : 'Source metadata has no redistributable images'
          );
          rejected += 1;
          if (scanned >= MAX_DISCOVERY_SCAN) {
            exhausted = false;
            break;
          }
          continue;
        }
        const metadataKey = `ingestion/jobs/${id}/artifact.json`;
        await env.UNPUBLISHED_MEDIA.put(metadataKey, JSON.stringify(artifact), {
          httpMetadata: { contentType: 'application/json' }
        });
        metadataKeys.push(metadataKey);
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
    if (queueMessages.length) {
      await env.INGEST_QUEUE.sendBatch(queueMessages);
      queueMessagesSent = true;
    }

    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO ingestion_discovery_state (source,offset,cursor,updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(source) DO UPDATE SET offset=excluded.offset,cursor=excluded.cursor,updated_at=excluded.updated_at`
      ).bind(
        source,
        exhausted ? 0 : (checkpoint.offset ?? 0),
        exhausted ? null : (checkpoint.cursor ?? null),
        now
      ),
      env.DB.prepare('UPDATE ingestion_runs SET discovered = ?, updated_at = ? WHERE id = ?').bind(
        discovered,
        now,
        runId
      ),
      env.DB.prepare('UPDATE ingestion_runs SET rejected = ? WHERE id = ?').bind(rejected, runId),
      env.DB.prepare(
        `UPDATE ingestion_runs SET
          status=CASE WHEN processed>=? THEN 'completed' ELSE 'running' END,
          ended_at=CASE WHEN processed>=? THEN ? ELSE NULL END,
          updated_at=? WHERE id=?`
      ).bind(discovered, discovered, now, now, runId)
    ]);
    console.info(
      JSON.stringify({
        event: 'ingestion.discovery.published',
        runId,
        source,
        discovered,
        scanned,
        rejected
      })
    );
    return {
      runId,
      source,
      discovered,
      scanned,
      rejected,
      exhausted,
      checkpoint: {
        ...checkpoint,
        offset: exhausted ? 0 : (checkpoint.offset ?? 0),
        ...(exhausted ? { cursor: undefined } : {})
      }
    };
  } catch (error) {
    if (!queueMessagesSent) {
      await Promise.all(
        metadataKeys.map((key) => env.UNPUBLISHED_MEDIA.delete(key).catch(() => undefined))
      );
    }
    await env.DB.prepare(
      `UPDATE ingestion_runs SET status='failed',ended_at=?,errors=errors+1,report=?,updated_at=? WHERE id=?`
    )
      .bind(Date.now(), JSON.stringify({ failure: String(error) }), Date.now(), runId)
      .run()
      .catch(() => undefined);
    throw error;
  }
}

function rejectionCode(error: unknown): string | null {
  if (error instanceof HttpError && error.status === 404) return 'source_unavailable';
  if (!(error instanceof Error)) return null;
  if (error.name === 'ZodError') return 'invalid_metadata';
  if (error.message.includes('does not establish African origin')) return 'source_geography';
  return null;
}

async function recordRejection(
  env: IngestionEnv,
  runId: string,
  source: string,
  externalId: string,
  code: string,
  reason: string
) {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO review_records (id,run_id,source,external_id,reason_code,reason,payload,status,created_at,updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, 'open', ?, ?) ON CONFLICT(id) DO NOTHING`
  )
    .bind(
      await stableReviewId(`${source}:${externalId}:${code}`),
      runId,
      source,
      externalId,
      code,
      reason,
      now,
      now
    )
    .run();
}

async function stableId(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return `job_${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 24)}`;
}

async function stableReviewId(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return `rev_${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 24)}`;
}
