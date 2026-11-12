import { env } from 'cloudflare:workers';
import { featuredArtifacts, listArtifacts } from '$lib/server/artifacts';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ setHeaders }) => {
  setHeaders({ 'cache-control': 'public, max-age=60, s-maxage=300', 'cache-tag': 'artifacts' });
  const [featured, preview] = await Promise.all([
    featuredArtifacts(env, 5),
    listArtifacts(env, { sort: 'curated', limit: 12 })
  ]);
  return { featured, preview: preview.items };
};
