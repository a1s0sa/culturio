import { env } from 'cloudflare:workers';
import { json } from '@sveltejs/kit';
import { filtersFor } from '$lib/server/artifacts';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ setHeaders }) => {
  setHeaders({
    'cache-control': 'public, max-age=300, s-maxage=900',
    'cache-tag': 'artifact-filters'
  });
  return json(await filtersFor(env));
};
