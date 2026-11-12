import type { IngestionEnv, IngestionJob } from './types.js';

export async function consumeIngestionQueue(batch: MessageBatch<unknown>, env: IngestionEnv) {
  let started = 0;
  let duplicated = 0;
  let retried = 0;
  for (const message of batch.messages) {
    const job = parseIngestionJob(message.body) as IngestionJob | null;
    if (!job) {
      console.warn(JSON.stringify({ event: 'ingestion.queue.invalid', messageId: message.id }));
      message.retry();
      retried += 1;
      continue;
    }
    try {
      try {
        await env.INGEST_WORKFLOW.create({ id: job.id, params: job });
        await env.DB.prepare(
          "UPDATE ingestion_jobs SET status='processing',attempts=attempts+1,updated_at=? WHERE id=? AND status='queued'"
        )
          .bind(Date.now(), job.id)
          .run();
        started += 1;
      } catch (error) {
        const existing = await env.INGEST_WORKFLOW.get(job.id).catch(() => null);
        if (!existing) throw error;
        duplicated += 1;
      }
      message.ack();
    } catch (error) {
      console.error(
        JSON.stringify({
          event: 'ingestion.queue.workflow_start_failed',
          jobId: job.id,
          error: String(error)
        })
      );
      message.retry();
      retried += 1;
    }
  }
  console.info(
    JSON.stringify({
      event: 'ingestion.queue.batch',
      batchId: batch.queue,
      received: batch.messages.length,
      started,
      duplicated,
      retried
    })
  );
}

function parseIngestionJob(value: unknown): IngestionJob | null {
  if (!value || typeof value !== 'object') return null;
  const job = value as Record<string, unknown>;
  if (!(
    typeof job.id === 'string' &&
    /^job_[a-f0-9]{24}$/.test(job.id) &&
    typeof job.runId === 'string' &&
    /^[0-9a-f-]{36}$/i.test(job.runId) &&
    (job.source === 'met' || job.source === 'smithsonian') &&
    typeof job.externalId === 'string' &&
    job.externalId.length > 0 &&
    job.externalId.length <= 256
  ))
    return null;
  return job as unknown as IngestionJob;
}
