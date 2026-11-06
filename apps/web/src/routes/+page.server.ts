import { featuredArtifacts, listArtifacts } from '$lib/server/artifacts';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ platform, setHeaders }) => {
  setHeaders({ 'cache-control': 'public, max-age=60, s-maxage=300', 'cache-tag': 'artifacts' });
  const [featured, preview] = await Promise.all([
    featuredArtifacts(platform, 5),
    listArtifacts(platform, { sort: 'curated', limit: 12 })
  ]);
  return { featured, preview: preview.items };
};
