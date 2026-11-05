import { mkdir, writeFile } from 'node:fs/promises';
import pLimit from 'p-limit';
import type { IngestionMetrics, NormalizedArtifact, SourceAdapter, SourceCheckpoint, SourceName } from '@culturio/shared';
import type { Config } from '../config.js';
import type { D1HttpClient } from '../infrastructure/d1.js';
import type { Logger } from '../infrastructure/logger.js';
import type { S3Client } from '@aws-sdk/client-s3';
import { downloadImage } from '../media/download.js';
import { processImage } from '../media/process.js';
import { uploadProcessedImage } from '../media/upload.js';
import { findExactSource } from './deduplicate.js';
import { extractRecord } from './extract.js';
import { normalizeRecord } from './normalize.js';
import { createReview, persistArtifact, saveCheckpoint, sourceRecordHash, stableId, type PersistedMedia } from './persist.js';
import { validateRecord } from './validate.js';

export interface RunOptions { source: SourceName | 'all'; limit: number; dryRun: boolean; resumeRunId?: string; retryFailedRunId?: string; signal?: AbortSignal; }
export interface RunDependencies { config: Config; adapters: SourceAdapter<any>[]; d1?: D1HttpClient; r2?: S3Client; logger: Logger; }

export async function runIngestion(options: RunOptions, dependencies: RunDependencies) {
  const { config, logger, d1, r2 } = dependencies; const runId = options.resumeRunId ?? crypto.randomUUID(); const startedAt = Date.now();
  const metrics: IngestionMetrics = { discovered:0,processed:0,inserted:0,updated:0,skipped:0,rejected:0,imagesProcessed:0,errors:0,sourceRequestMs:[],imageProcessingMs:[],uploadMs:[],databaseWriteMs:[],inputBytes:0,outputBytes:0 };
  if (!options.dryRun && !d1) throw new Error('D1 client is required for a publishing run');
  if (!options.dryRun && !r2) throw new Error('R2 client is required for a publishing run');
  if (d1 && !options.resumeRunId) await d1.batch([{ sql: 'INSERT INTO ingestion_runs (id,source,status,started_at,created_at,updated_at) VALUES (?,?,?,?,?,?)', params: [runId,options.source,'running',startedAt,startedAt,startedAt] }], options.signal);
  const adapters = dependencies.adapters.filter((adapter) => options.source === 'all' || adapter.source === options.source);
  const apiLimit = pLimit(config.API_CONCURRENCY); const downloadLimit = pLimit(config.DOWNLOAD_CONCURRENCY); const processLimit = pLimit(config.PROCESS_CONCURRENCY); const uploadLimit = pLimit(config.UPLOAD_CONCURRENCY); const writeLimit = pLimit(config.D1_CONCURRENCY);
  try {
    for (const adapter of adapters) {
      let checkpoint: SourceCheckpoint = d1 && options.resumeRunId ? await loadCheckpoint(d1, runId, adapter.source, options.signal) : {};
      const candidates = options.retryFailedRunId && d1 ? failedCandidates(d1,options.retryFailedRunId,adapter.source,options.signal) : adapter.discover(checkpoint, options.signal);
      for await (const candidate of candidates) {
        if (metrics.processed >= options.limit) break;
        metrics.discovered += 1; const itemStarted = performance.now();
        try {
          const requestStarted = performance.now(); const raw = await apiLimit(() => extractRecord(adapter,candidate.externalId,options.signal)); metrics.sourceRequestMs.push(performance.now() - requestStarted);
          const artifact = validateRecord(await normalizeRecord(adapter,raw)); const hash = sourceRecordHash(artifact.raw); const existing = d1 ? await findExactSource(d1, artifact.source, artifact.externalId, options.signal) : null;
          if (existing?.record_hash === hash) { metrics.skipped += 1; metrics.processed += 1; checkpoint = candidate.checkpoint; if (d1) await saveCheckpoint(d1,runId,adapter.source,checkpoint,candidate.externalId,options.signal); continue; }
          const artifactId = stableId('art', `${artifact.source}:${artifact.externalId}`); const media = await processMedia(artifact, artifactId, options, dependencies, metrics, downloadLimit, processLimit, uploadLimit);
          if (!options.dryRun && d1) { const before = performance.now(); const result = await writeLimit(() => persistArtifact(d1,artifact,hash,media,options.signal)); metrics.databaseWriteMs.push(performance.now()-before); result.inserted ? metrics.inserted += 1 : metrics.updated += 1; if (artifact.geographyConfidence === 'ambiguous') await createReview(d1,runId,artifact.source,artifact.externalId,'ambiguous_geography','Geographic metadata requires review',artifact.raw,options.signal); for (const image of artifact.images.filter((item) => !item.license.redistributionAllowed)) await createReview(d1,runId,artifact.source,artifact.externalId,'media_license','Media was not copied because redistribution permission is absent or ambiguous',{ sourceUrl:image.sourceUrl, license:image.license },options.signal); }
          else { existing ? metrics.updated += 1 : metrics.inserted += 1; }
          metrics.processed += 1; checkpoint = candidate.checkpoint; if (d1) await saveCheckpoint(d1,runId,adapter.source,checkpoint,candidate.externalId,options.signal);
          logger.info({ runId, source:adapter.source, artifactId, stage:'complete', durationMs:performance.now()-itemStarted }, 'artifact processed');
        } catch (error) { metrics.errors += 1; metrics.rejected += 1; logger.error({ runId,source:adapter.source,externalId:candidate.externalId,stage:'record',errorCategory:error instanceof Error ? error.name : 'unknown',err:error }, 'record failed'); if (d1) await createReview(d1,runId,adapter.source,candidate.externalId,'processing_error',error instanceof Error ? error.message : 'Unknown processing error',null,options.signal).catch(() => undefined); }
      }
    }
    return await finishRun(runId,'completed',startedAt,metrics,options,d1);
  } catch (error) { if (d1) await finishRun(runId,options.signal?.aborted ? 'cancelled' : 'failed',startedAt,metrics,options,d1).catch(() => undefined); throw error; }
}

async function processMedia(artifact: NormalizedArtifact, artifactId: string, options: RunOptions, deps: RunDependencies, metrics: IngestionMetrics, downloadLimit: ReturnType<typeof pLimit>, processLimit: ReturnType<typeof pLimit>, uploadLimit: ReturnType<typeof pLimit>): Promise<PersistedMedia[]> {
  const allowed = artifact.images.filter((image) => image.license.redistributionAllowed);
  const results = await Promise.all(allowed.map(async (image): Promise<PersistedMedia | null> => {
    try {
      const downloaded = await downloadLimit(() => downloadImage(image.sourceUrl,{ maxBytes:deps.config.IMAGE_MAX_BYTES,timeoutMs:deps.config.IMAGE_TIMEOUT_MS },options.signal)); metrics.inputBytes += downloaded.buffer.length;
      const processStarted=performance.now(); const processed=await processLimit(() => processImage(downloaded.buffer,deps.config.IMAGE_WEBP_QUALITY)); metrics.imageProcessingMs.push(performance.now()-processStarted); metrics.outputBytes += processed.variants.reduce((sum,item)=>sum+item.byteSize,0);
      let uploaded: Awaited<ReturnType<typeof uploadProcessedImage>> = { originalKey:'', variants:processed.variants.map((variant)=>({ ...variant,buffer:undefined,objectKey:'' })) };
      if (!options.dryRun) { const before=performance.now(); uploaded=await uploadLimit(() => uploadProcessedImage(deps.r2!,deps.config.R2_BUCKET_NAME!,artifactId,downloaded.buffer,downloaded.mimeType,processed)); metrics.uploadMs.push(performance.now()-before); }
      metrics.imagesProcessed += 1;
      return { sourceUrl:image.sourceUrl,mimeType:downloaded.mimeType,width:processed.width,height:processed.height,dominantColor:processed.dominantColor,hash:processed.hash,originalKey:uploaded.originalKey,licenseIdentifier:image.license.identifier,licenseUrl:image.license.url,attribution:image.license.attribution,variants:uploaded.variants };
    } catch (error) { metrics.errors += 1; deps.logger.warn({ source:artifact.source,externalId:artifact.externalId,stage:'media',errorCategory:error instanceof Error ? error.name : 'unknown',err:error },'image processing failed; artifact will continue'); return null; }
  }));
  return results.filter((item): item is PersistedMedia => item !== null);
}
async function loadCheckpoint(client:D1HttpClient,runId:string,source:string,signal?:AbortSignal):Promise<SourceCheckpoint>{ const rows=await client.query<{state:string}>('SELECT state FROM ingestion_checkpoints WHERE run_id=? AND source=?',[runId,source],signal); return rows[0] ? JSON.parse(rows[0].state) as SourceCheckpoint : {}; }
async function finishRun(runId:string,status:string,startedAt:number,metrics:IngestionMetrics,options:RunOptions,d1?:D1HttpClient){ const endedAt=Date.now(); const durationMs=endedAt-startedAt; const report={runId,status,source:options.source,dryRun:options.dryRun,startedAt:new Date(startedAt).toISOString(),endedAt:new Date(endedAt).toISOString(),durationMs,artifactsPerMinute:durationMs ? metrics.processed/(durationMs/60000):0,averageSourceRequestMs:average(metrics.sourceRequestMs),averageImageProcessingMs:average(metrics.imageProcessingMs),averageUploadMs:average(metrics.uploadMs),averageDatabaseWriteMs:average(metrics.databaseWriteMs),compressionSavingsBytes:metrics.inputBytes-metrics.outputBytes,peakRssBytes:process.memoryUsage().rss,...metrics}; await mkdir('reports',{recursive:true}); await writeFile(`reports/${runId}.json`,JSON.stringify(report,null,2)); if(d1) await d1.batch([{sql:`UPDATE ingestion_runs SET status=?,ended_at=?,discovered=?,processed=?,inserted=?,updated=?,skipped=?,rejected=?,images_processed=?,errors=?,report=?,updated_at=? WHERE id=?`,params:[status,endedAt,metrics.discovered,metrics.processed,metrics.inserted,metrics.updated,metrics.skipped,metrics.rejected,metrics.imagesProcessed,metrics.errors,JSON.stringify(report),endedAt,runId]}]); return report; }
function average(values:number[]):number { return values.length ? values.reduce((sum,value)=>sum+value,0)/values.length : 0; }
async function* failedCandidates(client:D1HttpClient,runId:string,source:SourceName,signal?:AbortSignal){ const rows=await client.query<{external_id:string}>('SELECT external_id FROM review_records WHERE run_id=? AND source=? AND status=\'open\' AND external_id IS NOT NULL ORDER BY created_at',[runId,source],signal); for(const row of rows) yield {source,externalId:row.external_id,checkpoint:{}}; }
