import type { IngestionEnv, IngestionJob } from './types.js';

export async function markIngestionJob(
  env: IngestionEnv,
  job: IngestionJob,
  status: 'completed' | 'skipped' | 'review' | 'failed',
  failureReason: string | null = null,
  result: 'inserted' | 'updated' | 'skipped' | null = null,
  onlyIfQueued = false
) {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE ingestion_jobs SET status=?,result=?,failure_reason=?,completed_at=?,updated_at=?
       WHERE id=? AND (?=0 OR status='queued')`
    ).bind(status, result, failureReason, now, now, job.id, onlyIfQueued ? 1 : 0),
    env.DB.prepare(
      `UPDATE ingestion_runs SET
        processed=(SELECT COUNT(*) FROM ingestion_jobs WHERE run_id=? AND status IN ('completed','skipped','review','failed')),
        inserted=(SELECT COUNT(*) FROM ingestion_jobs WHERE run_id=? AND result='inserted'),
        updated=(SELECT COUNT(*) FROM ingestion_jobs WHERE run_id=? AND result='updated'),
        skipped=(SELECT COUNT(*) FROM ingestion_jobs WHERE run_id=? AND status='skipped'),
        errors=(SELECT COUNT(*) FROM ingestion_jobs WHERE run_id=? AND status='failed'),
        status=CASE
          WHEN (SELECT COUNT(*) FROM ingestion_jobs WHERE run_id=? AND status IN ('completed','skipped','review','failed')) < discovered THEN 'running'
          WHEN (SELECT COUNT(*) FROM ingestion_jobs WHERE run_id=? AND status='failed') = (SELECT COUNT(*) FROM ingestion_jobs WHERE run_id=? AND status IN ('completed','skipped','review','failed')) THEN 'failed'
          ELSE 'completed'
        END,
        ended_at=CASE WHEN (SELECT COUNT(*) FROM ingestion_jobs WHERE run_id=? AND status IN ('completed','skipped','review','failed')) >= discovered THEN ? ELSE NULL END,
        updated_at=? WHERE id=?`
    ).bind(
      job.runId,
      job.runId,
      job.runId,
      job.runId,
      job.runId,
      job.runId,
      job.runId,
      job.runId,
      job.runId,
      now,
      now,
      job.runId
    )
  ]);
}
