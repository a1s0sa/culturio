import { error } from '@sveltejs/kit';
import { publishArtifact } from '../moderation.js';
import type { IngestionEnv } from './types.js';

export async function publishEligibleRunArtifacts(env: IngestionEnv, runIds: string[]) {
  const placeholders = runIds.map(() => '?').join(',');
  const runs = await env.DB.prepare(
    `SELECT id,status FROM ingestion_runs WHERE id IN (${placeholders})`
  )
    .bind(...runIds)
    .all<{ id: string; status: string }>();
  if (runs.results.length !== runIds.length) error(404, 'An ingestion run was not found.');
  if (runs.results.some((run) => run.status === 'running'))
    error(409, 'Ingestion runs are still processing.');

  const artifacts = await env.DB.prepare(
    `SELECT DISTINCT a.id FROM ingestion_jobs j
     JOIN artifact_sources s ON s.institution=j.source AND s.external_id=j.external_id
     JOIN artifacts a ON a.id=s.artifact_id
     WHERE j.run_id IN (${placeholders}) AND j.status IN ('completed','review')
       AND a.publication_status='draft'
       AND EXISTS (
         SELECT 1 FROM artifact_images i
         WHERE i.artifact_id=a.id AND i.redistribution_allowed=1
           AND i.processed_at IS NOT NULL AND i.original_object_key IS NOT NULL
           AND i.publication_status!='restricted'
           AND EXISTS (SELECT 1 FROM image_variants v WHERE v.image_id=i.id)
       )
     ORDER BY a.id`
  )
    .bind(...runIds)
    .all<{ id: string }>();

  const published: string[] = [];
  const failed: { artifactId: string; reason: string }[] = [];
  for (const { id } of artifacts.results) {
    try {
      await publishArtifact(
        env.DB,
        env,
        id,
        { type: 'automation' },
        'publish',
        'Automatically published after successful ingestion.'
      );
      published.push(id);
    } catch (cause) {
      failed.push({
        artifactId: id,
        reason: cause instanceof Error ? cause.message : String(cause)
      });
    }
  }
  return { published, failed };
}
