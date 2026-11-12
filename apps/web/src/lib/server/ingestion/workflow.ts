import { normalizedArtifactSchema } from '@culturio/shared';
import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
  type WorkflowStepConfig
} from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import type { IngestionEnv, IngestionJob } from './types.js';
import { retrieveAndNormalize } from './types.js';

const stepRetries = {
  retries: { limit: 4, delay: '10 seconds' as const, backoff: 'exponential' as const }
} satisfies WorkflowStepConfig;
const allowedImageHosts: Record<IngestionJob['source'], string[]> = {
  met: ['metmuseum.org'],
  smithsonian: ['si.edu']
};
const variants = [
  { name: 'thumbnail', width: 320 },
  { name: 'medium', width: 640 },
  { name: 'large', width: 1280 }
] as const;

type Artifact = ReturnType<typeof normalizedArtifactSchema.parse>;
type MediaRef = {
  sourceUrl: string;
  mimeType: string;
  width: number;
  height: number;
  hash: string;
  originalKey: string;
  licenseIdentifier: string | null;
  licenseUrl: string | null;
  attribution: string | null;
  variants: {
    name: string;
    width: number;
    height: number;
    byteSize: number;
    mimeType: string;
    objectKey: string;
  }[];
};

export class IngestionWorkflow extends WorkflowEntrypoint<IngestionEnv, IngestionJob> {
  async run(event: WorkflowEvent<IngestionJob>, step: WorkflowStep) {
    const job = event.payload;
    try {
      const metadataKey = (await step.do<string>(
        'retrieve-and-normalize-metadata',
        stepRetries,
        async () => {
          let artifact: Artifact;
          try {
            artifact = normalizedArtifactSchema.parse(
              await retrieveAndNormalize(this.env, job.source, job.externalId)
            );
          } catch (error) {
            if (
              error instanceof Error &&
              (error.name === 'ZodError' ||
                error.message.includes('does not establish African origin'))
            ) {
              await createReview(
                this.env,
                job,
                error.message,
                error.name === 'ZodError' ? 'invalid_metadata' : 'source_geography'
              );
              throw new NonRetryableError(error.message);
            }
            throw error;
          }
          const key = `ingestion/jobs/${job.id}/artifact.json`;
          await this.env.MEDIA.put(key, JSON.stringify(artifact), {
            httpMetadata: { contentType: 'application/json' }
          });
          return key;
        }
      )) as string;

      const duplicate = (await step.do<{ skipped: boolean; hash: string }>(
        'check-source-duplicate',
        async () => {
          const artifact = await readArtifact(this.env, metadataKey);
          const hash = await digest(canonicalize(artifact.raw));
          const existing = await this.env.DB.prepare(
            'SELECT record_hash FROM artifact_sources WHERE institution = ? AND external_id = ? LIMIT 1'
          )
            .bind(artifact.source, artifact.externalId)
            .first<{ record_hash: string }>();
          if (existing?.record_hash === hash) {
            await markJob(this.env, job, 'skipped');
            return { skipped: true, hash };
          }
          return { skipped: false, hash };
        }
      )) as { skipped: boolean; hash: string };
      if (duplicate.skipped) {
        await step.do('cleanup-duplicate-metadata', async () => this.env.MEDIA.delete(metadataKey));
        return { status: 'skipped' };
      }

      const media = (await step.do<MediaRef[]>(
        'store-original-and-image-variants',
        { ...stepRetries, timeout: '20 minutes' },
        async () => processImages(this.env, job, await readArtifact(this.env, metadataKey))
      )) as MediaRef[];

      const persisted = (await step.do<Awaited<ReturnType<typeof persistArtifact>>>(
        'persist-artifact-in-d1',
        stepRetries,
        async () => {
          const artifact = await readArtifact(this.env, metadataKey);
          const result = await persistArtifact(this.env, job, artifact, duplicate.hash, media);
          return result;
        }
      )) as Awaited<ReturnType<typeof persistArtifact>>;

      await step.do('mark-ingestion-job-completed', async () => {
        await markJob(
          this.env,
          job,
          persisted.status,
          null,
          persisted.inserted ? 'inserted' : 'updated'
        );
        await this.env.MEDIA.delete(metadataKey);
        console.info(
          JSON.stringify({
            event: 'ingestion.job.completed',
            ...job,
            artifactId: persisted.artifactId
          })
        );
      });
      return { status: 'completed', artifactId: persisted.artifactId };
    } catch (error) {
      await markJob(
        this.env,
        job,
        'failed',
        error instanceof Error ? error.message : String(error)
      );
      if (error instanceof NonRetryableError) await this.env.INGEST_DLQ.send(job);
      console.error(
        JSON.stringify({ event: 'ingestion.job.failed', ...job, error: String(error) })
      );
      throw error;
    }
  }
}

async function readArtifact(env: IngestionEnv, key: string): Promise<Artifact> {
  const object = await env.MEDIA.get(key);
  if (!object) throw new Error(`Workflow metadata object is missing: ${key}`);
  return normalizedArtifactSchema.parse(await object.json());
}

async function processImages(
  env: IngestionEnv,
  job: IngestionJob,
  artifact: Artifact
): Promise<MediaRef[]> {
  const result: MediaRef[] = [];
  for (const image of artifact.images) {
    if (!image.license.redistributionAllowed) continue;
    try {
      const url = new URL(image.sourceUrl);
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        !allowedImageHosts[job.source].some(
          (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
        )
      ) {
        throw new PermanentIngestionError(`Image host is not allowed: ${url.hostname}`);
      }
      const response = await fetch(url, { redirect: 'manual' });
      if (!response.ok) {
        if (response.status === 408 || response.status === 429 || response.status >= 500) {
          throw new Error(`Image download returned ${response.status}`);
        }
        throw new PermanentIngestionError(`Image download returned ${response.status}`);
      }
      const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
      if (
        !mimeType ||
        !['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(mimeType)
      ) {
        throw new PermanentIngestionError(
          `Unsupported image content type: ${mimeType ?? 'missing'}`
        );
      }
      const declaredLength = Number(response.headers.get('content-length') ?? 0);
      if (declaredLength > 20 * 1024 * 1024)
        throw new PermanentIngestionError('Image exceeds 20 MiB limit');
      const bytes = await readBounded(response, 20 * 1024 * 1024);
      let info: ImageInfoResponse;
      try {
        info = await env.IMAGES.info(new Blob([bytes]).stream());
      } catch (error) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'numericCode' in error &&
          error.numericCode === 9412
        ) {
          throw new PermanentIngestionError('Image content could not be decoded');
        }
        throw error;
      }
      if (
        !('width' in info) ||
        !info.width ||
        !info.height ||
        info.width * info.height > 80_000_000
      ) {
        throw new PermanentIngestionError('Image dimensions are invalid or exceed 80 megapixels');
      }
      const hash = await digest(bytes);
      const artifactId = await id('art', `${artifact.source}:${artifact.externalId}`);
      const prefix = `artifacts/${artifactId}/${hash}`;
      const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.slice(6);
      const originalKey = `${prefix}/original.${extension}`;
      if (!(await env.MEDIA.head(originalKey))) {
        await env.MEDIA.put(originalKey, bytes, { httpMetadata: { contentType: mimeType } });
      }
      const outputVariants: MediaRef['variants'] = [];
      for (const variant of variants) {
        const objectKey = `${prefix}/${variant.width}.webp`;
        let object = await env.MEDIA.head(objectKey);
        if (!object) {
          const output = await env.IMAGES.input(new Blob([bytes]).stream())
            .transform({ width: variant.width, fit: 'scale-down' })
            .output({ format: 'image/webp' });
          const transformed = await output.response();
          const variantBytes = await transformed.arrayBuffer();
          object = await env.MEDIA.put(objectKey, variantBytes, {
            httpMetadata: { contentType: 'image/webp' }
          });
        }
        const width = Math.min(info.width, variant.width);
        outputVariants.push({
          name: variant.name,
          width,
          height: Math.max(1, Math.round((info.height * width) / info.width)),
          byteSize: object.size,
          mimeType: 'image/webp',
          objectKey
        });
      }
      result.push({
        sourceUrl: image.sourceUrl,
        mimeType,
        width: info.width,
        height: info.height,
        hash,
        originalKey,
        licenseIdentifier: image.license.identifier,
        licenseUrl: image.license.url,
        attribution: image.license.attribution,
        variants: outputVariants
      });
    } catch (error) {
      if (error instanceof PermanentIngestionError) {
        console.warn(
          JSON.stringify({
            event: 'ingestion.image.rejected',
            source: job.source,
            externalId: job.externalId,
            url: image.sourceUrl,
            reason: error.message
          })
        );
        continue;
      }
      throw error;
    }
  }
  return result;
}

async function persistArtifact(
  env: IngestionEnv,
  job: IngestionJob,
  artifact: Artifact,
  recordHash: string,
  media: MediaRef[]
) {
  const artifactId = await id('art', `${artifact.source}:${artifact.externalId}`);
  const sourceId = await id('src', `${artifact.source}:${artifact.externalId}`);
  const now = Date.now();
  const existing = await env.DB.prepare(
    'SELECT id FROM artifact_sources WHERE institution = ? AND external_id = ? LIMIT 1'
  )
    .bind(artifact.source, artifact.externalId)
    .first();
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO artifacts (id,slug,title,alternative_names,description,artifact_type,origin,historical_period,earliest_year,latest_year,date_display,date_uncertain,materials,dimensions,publication_status,quality_score,search_cultures,search_civilizations,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,alternative_names=excluded.alternative_names,description=excluded.description,artifact_type=excluded.artifact_type,origin=excluded.origin,historical_period=excluded.historical_period,earliest_year=excluded.earliest_year,latest_year=excluded.latest_year,date_display=excluded.date_display,date_uncertain=excluded.date_uncertain,materials=excluded.materials,dimensions=excluded.dimensions,publication_status=excluded.publication_status,quality_score=excluded.quality_score,search_cultures=excluded.search_cultures,search_civilizations=excluded.search_civilizations,updated_at=excluded.updated_at`
    ).bind(
      artifactId,
      `${slugify(artifact.title)}-${artifactId.slice(-8)}`,
      artifact.title,
      JSON.stringify(artifact.alternativeNames),
      artifact.description,
      artifact.artifactType,
      artifact.origin,
      artifact.historicalPeriod,
      artifact.earliestYear,
      artifact.latestYear,
      artifact.dateDisplay,
      artifact.dateUncertain ? 1 : 0,
      JSON.stringify(artifact.materials),
      artifact.dimensions,
      artifact.geographyConfidence === 'confirmed' ? 'draft' : 'review',
      scoreArtifact(artifact),
      artifact.cultures.join(' '),
      artifact.civilizations.join(' '),
      now,
      now
    ),
    env.DB.prepare(
      `INSERT INTO artifact_sources (id,artifact_id,institution,external_id,source_url,accession_number,raw_metadata,last_fetched_at,attribution,metadata_license,record_hash,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(institution,external_id) DO UPDATE SET source_url=excluded.source_url,accession_number=excluded.accession_number,raw_metadata=excluded.raw_metadata,last_fetched_at=excluded.last_fetched_at,attribution=excluded.attribution,metadata_license=excluded.metadata_license,record_hash=excluded.record_hash,updated_at=excluded.updated_at`
    ).bind(
      sourceId,
      artifactId,
      artifact.source,
      artifact.externalId,
      artifact.sourceUrl,
      artifact.accessionNumber,
      JSON.stringify(artifact.raw),
      now,
      artifact.sourceAttribution,
      artifact.metadataLicense,
      recordHash,
      now,
      now
    )
  ];
  for (const name of artifact.cultures) {
    const cultureId = await id('cul', name.toLowerCase());
    statements.push(
      env.DB.prepare(
        'INSERT INTO cultures (id,name,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT(name) DO NOTHING'
      ).bind(cultureId, name, now, now)
    );
    statements.push(
      env.DB.prepare(
        'INSERT INTO artifact_cultures (artifact_id,culture_id) VALUES (?,?) ON CONFLICT DO NOTHING'
      ).bind(artifactId, cultureId)
    );
  }
  for (const name of artifact.civilizations) {
    const civilizationId = await id('civ', name.toLowerCase());
    statements.push(
      env.DB.prepare(
        'INSERT INTO civilizations (id,name,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT(name) DO NOTHING'
      ).bind(civilizationId, name, now, now)
    );
    statements.push(
      env.DB.prepare(
        'INSERT INTO artifact_civilizations (artifact_id,civilization_id) VALUES (?,?) ON CONFLICT DO NOTHING'
      ).bind(artifactId, civilizationId)
    );
  }
  for (const item of media) {
    const imageId = await id('img', `${sourceId}:${item.sourceUrl}`);
    statements.push(
      env.DB.prepare(
        `INSERT INTO artifact_images (id,artifact_id,source_id,original_url,width,height,mime_type,content_hash,original_object_key,license_identifier,license_url,attribution,redistribution_allowed,publication_status,processed_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(source_id,original_url) DO UPDATE SET width=excluded.width,height=excluded.height,mime_type=excluded.mime_type,content_hash=excluded.content_hash,original_object_key=excluded.original_object_key,processed_at=excluded.processed_at,updated_at=excluded.updated_at`
      ).bind(
        imageId,
        artifactId,
        sourceId,
        item.sourceUrl,
        item.width,
        item.height,
        item.mimeType,
        item.hash,
        item.originalKey,
        item.licenseIdentifier,
        item.licenseUrl,
        item.attribution,
        1,
        'draft',
        now,
        now,
        now
      )
    );
    for (const variant of item.variants) {
      const variantId = await id('var', `${imageId}:${variant.name}`);
      statements.push(
        env.DB.prepare(
          `INSERT INTO image_variants (id,image_id,name,width,height,byte_size,mime_type,object_key,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(image_id,name) DO UPDATE SET width=excluded.width,height=excluded.height,byte_size=excluded.byte_size,object_key=excluded.object_key,updated_at=excluded.updated_at`
        ).bind(
          variantId,
          imageId,
          variant.name,
          variant.width,
          variant.height,
          variant.byteSize,
          variant.mimeType,
          variant.objectKey,
          now,
          now
        )
      );
    }
  }
  const hosted = new Set(media.map((item) => item.sourceUrl));
  for (const image of artifact.images.filter((item) => !hosted.has(item.sourceUrl))) {
    const imageId = await id('img', `${sourceId}:${image.sourceUrl}`);
    statements.push(
      env.DB.prepare(
        `INSERT INTO artifact_images (id,artifact_id,source_id,original_url,width,height,mime_type,license_identifier,license_url,attribution,redistribution_allowed,publication_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(source_id,original_url) DO UPDATE SET license_identifier=excluded.license_identifier,license_url=excluded.license_url,attribution=excluded.attribution,redistribution_allowed=excluded.redistribution_allowed,publication_status=excluded.publication_status,updated_at=excluded.updated_at`
      ).bind(
        imageId,
        artifactId,
        sourceId,
        image.sourceUrl,
        image.width,
        image.height,
        image.mimeType,
        image.license.identifier,
        image.license.url,
        image.license.attribution,
        image.license.redistributionAllowed ? 1 : 0,
        image.license.redistributionAllowed ? 'review' : 'restricted',
        now,
        now
      )
    );
  }
  if (artifact.geographyConfidence === 'ambiguous') {
    statements.push(
      env.DB.prepare(
        `INSERT INTO review_records (id,run_id,source,external_id,reason_code,reason,payload,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`
      ).bind(
        await id('rev', `${artifact.source}:${artifact.externalId}:ambiguous_geography`),
        job.runId,
        artifact.source,
        artifact.externalId,
        'ambiguous_geography',
        'Geographic metadata requires review',
        JSON.stringify(artifact.raw),
        'open',
        now,
        now
      )
    );
  }
  for (const image of artifact.images.filter((item) => !item.license.redistributionAllowed)) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO review_records (id,run_id,source,external_id,reason_code,reason,payload,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`
      ).bind(
        await id(
          'rev',
          `${artifact.source}:${artifact.externalId}:media_license:${image.sourceUrl}`
        ),
        job.runId,
        artifact.source,
        artifact.externalId,
        'media_license',
        'Media was not copied because redistribution permission is absent or ambiguous',
        JSON.stringify({ sourceUrl: image.sourceUrl, license: image.license }),
        'open',
        now,
        now
      )
    );
  }
  for (let index = 0; index < statements.length; index += 100)
    await env.DB.batch(statements.slice(index, index + 100));
  return {
    artifactId,
    inserted: !existing,
    status:
      artifact.geographyConfidence === 'ambiguous' ||
      artifact.images.some((image) => !image.license.redistributionAllowed)
        ? 'review'
        : 'completed'
  };
}

async function markJob(
  env: IngestionEnv,
  job: IngestionJob,
  status: string,
  failureReason: string | null = null,
  result: 'inserted' | 'updated' | 'skipped' | null = null
) {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(
      'UPDATE ingestion_jobs SET status=?,result=?,failure_reason=?,completed_at=?,updated_at=? WHERE id=?'
    ).bind(
      status,
      result,
      failureReason,
      ['completed', 'skipped', 'review', 'failed'].includes(status) ? now : null,
      now,
      job.id
    ),
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

async function createReview(env: IngestionEnv, job: IngestionJob, reason: string, code: string) {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO review_records (id,run_id,source,external_id,reason_code,reason,payload,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`
  )
    .bind(
      await id('rev', `${job.id}:${code}`),
      job.runId,
      job.source,
      job.externalId,
      code,
      reason,
      JSON.stringify({ jobId: job.id }),
      'open',
      now,
      now
    )
    .run();
}

async function readBounded(response: Response, maxBytes: number) {
  if (!response.body) throw new PermanentIngestionError('Image response has no body');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new PermanentIngestionError(`Image exceeds ${maxBytes} byte limit`);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function slugify(value: string) {
  return (
    value
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 72) || 'artifact'
  );
}
function scoreArtifact(value: Artifact) {
  return Math.min(
    1,
    [
      value.title,
      value.description,
      value.artifactType,
      value.origin,
      value.dateDisplay,
      value.materials.length ? 'yes' : null,
      value.images.length ? 'yes' : null
    ].filter(Boolean).length / 7
  );
}
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  return value;
}
async function digest(value: unknown) {
  const bytes =
    value instanceof Uint8Array ? value : new TextEncoder().encode(JSON.stringify(value));
  const hash = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
async function id(namespace: string, value: string) {
  return `${namespace}_${(await digest(value)).slice(0, 24)}`;
}
class PermanentIngestionError extends Error {}
