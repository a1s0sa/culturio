import { env } from 'cloudflare:workers';
import { error } from '@sveltejs/kit';
import { createAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

type MediaRecord = {
  redistribution_allowed: number;
  image_status: string;
  artifact_status: string;
  processed_at: number | null;
};

export const GET: RequestHandler = async ({ params, request, setHeaders }) => {
  const key = params.key;
  const record = await env.DB.prepare(
    `SELECT i.redistribution_allowed,i.publication_status image_status,
      a.publication_status artifact_status,i.processed_at
     FROM image_variants v
     JOIN artifact_images i ON i.id=v.image_id
     JOIN artifacts a ON a.id=i.artifact_id
     WHERE v.object_key=?`
  )
    .bind(key)
    .first<MediaRecord>();

  if (!record || record.redistribution_allowed !== 1 || !record.processed_at) error(404);

  const isPublished = record.image_status === 'published' && record.artifact_status === 'published';
  if (!isPublished) {
    const session = await createAuth(env).api.getSession({ headers: request.headers });
    if (session?.user.role !== 'moderator' || record.image_status === 'restricted') error(404);
    setHeaders({ 'cache-control': 'private, no-store' });
  } else {
    setHeaders({ 'cache-control': 'public, max-age=60, s-maxage=300' });
  }

  const object = await (isPublished ? env.MEDIA : env.UNPUBLISHED_MEDIA).get(key);
  if (!object) error(404);
  const headers = new Headers();
  if (object.httpMetadata?.contentType)
    headers.set('content-type', object.httpMetadata.contentType);
  headers.set('content-length', String(object.size));
  return new Response(object.body, { headers });
};
