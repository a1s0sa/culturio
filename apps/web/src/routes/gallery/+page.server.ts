import { env } from 'cloudflare:workers';
import { parseGallerySearchParams } from '@culturio/shared';
import { filtersFor, listArtifacts } from '$lib/server/artifacts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  const query = parseGallerySearchParams(url.searchParams);
  delete query.cursor;
  setHeaders({
    'cache-control': query.q
      ? 'public, max-age=30, s-maxage=60'
      : 'public, max-age=60, s-maxage=300',
    'cache-tag': 'artifacts'
  });
  const [page, filters] = await Promise.all([listArtifacts(env, query), filtersFor(env)]);
  return { page, filters, query };
};
