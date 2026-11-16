import { error } from '@sveltejs/kit';
import { createAuth } from './auth';

type ModerationEnv = Cloudflare.Env;
type SourceView = {
  institution: string;
  externalId: string;
  url: string;
  accessionNumber: string | null;
  attribution: string | null;
};
type ImageView = {
  id: string;
  url: string;
  previewUrl: string | null;
  license: string | null;
  licenseUrl: string | null;
  attribution: string | null;
  eligible: boolean;
  status: string;
};
type ModerationRow = {
  id: string;
  title: string;
  slug: string;
  origin: string | null;
  historical_period: string | null;
  date_display: string | null;
  publication_status: string;
  institution: string | null;
  external_id: string | null;
  source_url: string | null;
  accession_number: string | null;
  source_attribution: string | null;
  image_id: string | null;
  original_url: string | null;
  license_identifier: string | null;
  license_url: string | null;
  image_attribution: string | null;
  redistribution_allowed: number | null;
  processed_at: number | null;
  original_object_key: string | null;
  has_variants: number;
  image_status: string | null;
  thumbnail_key: string | null;
  medium_key: string | null;
};
type ModerationArtifact = Omit<
  ModerationRow,
  | 'institution'
  | 'external_id'
  | 'source_url'
  | 'accession_number'
  | 'source_attribution'
  | 'image_id'
  | 'original_url'
  | 'license_identifier'
  | 'license_url'
  | 'image_attribution'
  | 'redistribution_allowed'
  | 'processed_at'
  | 'original_object_key'
  | 'has_variants'
  | 'image_status'
> & {
  sources: SourceView[];
  images: ImageView[];
};

export async function requireModerator(request: Request, env: ModerationEnv) {
  const session = await createAuth(env).api.getSession({ headers: request.headers });
  if (!session) error(401, 'Sign in to access moderation.');
  if (session.user.role !== 'moderator') error(403, 'Moderator access required.');
  return session.user;
}

export async function listDraftArtifacts(db: D1Database, moderatorId: string) {
  const { results } = await db
    .prepare(
      `SELECT a.id,a.title,a.slug,a.origin,a.historical_period,a.date_display,
        s.institution,s.external_id,s.source_url,s.accession_number,s.attribution source_attribution,
        i.id image_id,i.original_url,i.license_identifier,i.license_url,i.attribution image_attribution,
        i.redistribution_allowed,i.processed_at,i.original_object_key,
        (SELECT object_key FROM image_variants v WHERE v.image_id=i.id AND v.name='thumbnail') thumbnail_key,
        (SELECT object_key FROM image_variants v WHERE v.image_id=i.id AND v.name='medium') medium_key,
        EXISTS (SELECT 1 FROM image_variants v WHERE v.image_id=i.id) has_variants,
        i.publication_status image_status
       FROM artifacts a
       LEFT JOIN artifact_sources s ON s.artifact_id=a.id
       LEFT JOIN artifact_images i ON i.artifact_id=a.id
       WHERE a.publication_status='draft' OR (
         a.publication_status='published' AND EXISTS (
           SELECT 1 FROM artifact_publication_events e
           WHERE e.artifact_id=a.id AND e.moderator_id=? AND e.action='publish'
             AND e.id=(SELECT latest.id FROM artifact_publication_events latest
               WHERE latest.artifact_id=a.id
               ORDER BY latest.created_at DESC,latest.rowid DESC LIMIT 1)
         )
       )
       ORDER BY a.created_at,a.id`
    )
    .bind(moderatorId)
    .all<ModerationRow>();

  const byId = new Map<string, ModerationArtifact>();
  for (const row of results) {
    const id = String(row.id);
    let artifact = byId.get(id);
    if (!artifact) {
      artifact = { ...row, sources: [], images: [] };
      byId.set(id, artifact);
    }
    if (row.institution) {
      const source = {
        institution: row.institution,
        externalId: row.external_id ?? '',
        url: row.source_url ?? '',
        accessionNumber: row.accession_number,
        attribution: row.source_attribution
      };
      if (!artifact.sources.some((item) => JSON.stringify(item) === JSON.stringify(source)))
        artifact.sources.push(source);
    }
    if (row.image_id && !artifact.images.some((image) => image.id === row.image_id)) {
      artifact.images.push({
        id: row.image_id,
        url: row.original_url ?? '',
        previewUrl:
          row.thumbnail_key || row.medium_key
            ? `/media/${row.thumbnail_key ?? row.medium_key}`
            : null,
        license: row.license_identifier,
        licenseUrl: row.license_url,
        attribution: row.image_attribution,
        eligible:
          row.redistribution_allowed === 1 &&
          row.processed_at != null &&
          row.original_object_key != null &&
          row.has_variants === 1 &&
          row.image_status !== 'restricted',
        status: row.image_status ?? 'draft'
      });
    }
  }
  return [...byId.values()];
}

export async function publishArtifact(
  db: D1Database,
  env: Pick<Cloudflare.Env, 'MEDIA' | 'UNPUBLISHED_MEDIA'>,
  artifactId: string,
  moderatorId: string,
  action: 'publish' | 'unpublish',
  note: string | null
) {
  const id = crypto.randomUUID();
  const now = Date.now();
  if (action === 'publish') {
    const { results } = await db
      .prepare(
        `SELECT v.object_key FROM image_variants v
         JOIN artifact_images i ON i.id=v.image_id
         WHERE i.artifact_id=? AND i.redistribution_allowed=1 AND i.processed_at IS NOT NULL
           AND i.original_object_key IS NOT NULL AND i.publication_status!='restricted'`
      )
      .bind(artifactId)
      .all<{ object_key: string }>();
    if (!results.length) error(409, 'Artifact has no eligible processed image.');

    const copiedKeys: string[] = [];
    try {
      for (const { object_key: key } of results) {
        const source = await env.UNPUBLISHED_MEDIA.get(key);
        if (!source) error(409, 'An unpublished image variant is missing.');
        await env.MEDIA.put(key, source.body, {
          httpMetadata: {
            contentType: source.httpMetadata?.contentType ?? 'image/webp',
            cacheControl: 'public, max-age=300, s-maxage=600'
          }
        });
        copiedKeys.push(key);
      }
    } catch (cause) {
      await Promise.all(copiedKeys.map((key) => env.MEDIA.delete(key)));
      throw cause;
    }

    const transition = db
      .prepare(
        `UPDATE artifacts SET publication_status='published',updated_at=?
         WHERE id=? AND publication_status='draft'
         AND EXISTS (SELECT 1 FROM artifact_images i WHERE i.artifact_id=artifacts.id
           AND i.redistribution_allowed=1 AND i.processed_at IS NOT NULL
           AND i.original_object_key IS NOT NULL AND i.publication_status!='restricted'
           AND EXISTS (SELECT 1 FROM image_variants v WHERE v.image_id=i.id))`
      )
      .bind(now, artifactId);
    const audit = db
      .prepare(
        `INSERT INTO artifact_publication_events(id,artifact_id,moderator_id,action,note,created_at)
         SELECT ?,?,?,?, ?,? WHERE changes()=1`
      )
      .bind(id, artifactId, moderatorId, action, note, now);
    const images = db
      .prepare(
        `UPDATE artifact_images SET publication_status='published',updated_at=?
         WHERE artifact_id=? AND redistribution_allowed=1 AND processed_at IS NOT NULL
           AND original_object_key IS NOT NULL AND publication_status!='restricted'
           AND EXISTS (SELECT 1 FROM image_variants v WHERE v.image_id=artifact_images.id)
           AND EXISTS (SELECT 1 FROM artifact_publication_events e WHERE e.id=?)`
      )
      .bind(now, artifactId, id);
    try {
      const result = await db.batch([transition, audit, images]);
      if (!result[0]?.meta.changes) error(409, 'Artifact is no longer eligible for publication.');
    } catch (cause) {
      await Promise.all(copiedKeys.map((key) => env.MEDIA.delete(key)));
      throw cause;
    }
    // Keep only source originals in the private bucket after publication.
    // A cleanup failure must not make a completed D1 transition look unsuccessful.
    await Promise.allSettled(copiedKeys.map((key) => env.UNPUBLISHED_MEDIA.delete(key)));
    return;
  }

  const { results } = await db
    .prepare(
      `SELECT v.object_key FROM image_variants v
       JOIN artifact_images i ON i.id=v.image_id WHERE i.artifact_id=? AND i.publication_status='published'`
    )
    .bind(artifactId)
    .all<{ object_key: string }>();

  const restoredKeys: string[] = [];
  try {
    for (const { object_key: key } of results) {
      if (await env.UNPUBLISHED_MEDIA.head(key)) continue;
      const source = await env.MEDIA.get(key);
      if (!source) error(409, 'A published image variant is missing.');
      await env.UNPUBLISHED_MEDIA.put(key, source.body, {
        httpMetadata: {
          contentType: source.httpMetadata?.contentType ?? 'image/webp',
          cacheControl: 'private, no-store'
        }
      });
      restoredKeys.push(key);
    }
  } catch (cause) {
    await Promise.allSettled(restoredKeys.map((key) => env.UNPUBLISHED_MEDIA.delete(key)));
    throw cause;
  }

  const transition = db
    .prepare(
      `UPDATE artifacts SET publication_status='draft',updated_at=?
       WHERE id=? AND publication_status='published'`
    )
    .bind(now, artifactId);
  const audit = db
    .prepare(
      `INSERT INTO artifact_publication_events(id,artifact_id,moderator_id,action,note,created_at)
       SELECT ?,?,?,?, ?,? WHERE changes()=1`
    )
    .bind(id, artifactId, moderatorId, action, note, now);
  const images = db
    .prepare(
      `UPDATE artifact_images SET publication_status='draft',updated_at=?
       WHERE artifact_id=? AND publication_status='published'
       AND EXISTS (SELECT 1 FROM artifact_publication_events e WHERE e.id=?)`
    )
    .bind(now, artifactId, id);
  const result = await db.batch([transition, audit, images]);
  if (!result[0]?.meta.changes) error(409, 'Artifact is no longer published.');
  await Promise.all(results.map(({ object_key }) => env.MEDIA.delete(object_key)));
}
