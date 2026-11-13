import { env } from 'cloudflare:workers';
import { parseGallerySearchParams } from '@culturio/shared';
import { listArtifacts } from '$lib/server/artifacts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  const query = parseGallerySearchParams(url.searchParams);
  delete query.cursor;
  query.limit = 24;
  setHeaders({ 'cache-control': 'public, max-age=30, s-maxage=60', 'cache-tag': 'artifacts' });
  const page = await listArtifacts(env, query);
  return { page, query: query.q ?? '' };
};
