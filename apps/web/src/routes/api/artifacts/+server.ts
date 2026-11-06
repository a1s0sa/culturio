import { json } from '@sveltejs/kit';
import { parseGallerySearchParams } from '@culturio/shared';
import { listArtifacts } from '$lib/server/artifacts';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ url, platform, setHeaders }) => {
  const query = parseGallerySearchParams(url.searchParams);
  setHeaders({
    'cache-control': query.q
      ? 'public, max-age=15, s-maxage=60'
      : 'public, max-age=30, s-maxage=180',
    'cache-tag': 'artifacts'
  });
  return json(await listArtifacts(platform, query));
};
