import { error, json } from '@sveltejs/kit';
import { artifactBySlug } from '$lib/server/artifacts';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async ({ params, platform, setHeaders }) => {
  const artifact = await artifactBySlug(platform, params.slug);
  if (!artifact) error(404, 'Artifact not found');
  setHeaders({
    'cache-control': 'public, max-age=60, s-maxage=300',
    'cache-tag': `artifacts artifact-${artifact.id}`
  });
  return json(artifact);
};
