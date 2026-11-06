import { error } from '@sveltejs/kit';
import { artifactBySlug } from '$lib/server/artifacts';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ params, platform, setHeaders }) => {
  const artifact = await artifactBySlug(platform, params.slug);
  if (!artifact) error(404, 'Artifact not found');
  setHeaders({
    'cache-control': 'public, max-age=300, s-maxage=600',
    'cache-tag': `artifacts artifact-${artifact.id}`
  });
  return { artifact };
};
