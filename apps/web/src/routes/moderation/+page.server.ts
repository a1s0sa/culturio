import { env } from 'cloudflare:workers';
import { fail } from '@sveltejs/kit';
import { requireModerator, listDraftArtifacts, publishArtifact } from '$lib/server/moderation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
  const moderator = await requireModerator(request, env);
  return {
    artifacts: await listDraftArtifacts(env.DB, moderator.id)
  };
};

export const actions: Actions = {
  publish: async ({ request }) => {
    const moderator = await requireModerator(request, env);
    const data = await request.formData();
    const artifactId = data.get('artifactId');
    const note = data.get('note');
    if (typeof artifactId !== 'string' || !artifactId)
      return fail(400, { message: 'Missing artifact.' });
    await publishArtifact(
      env.DB,
      env,
      artifactId,
      { type: 'moderator', id: moderator.id },
      'publish',
      typeof note === 'string' && note.trim() ? note.trim().slice(0, 1000) : null
    );
    return { success: true };
  },
  unpublish: async ({ request }) => {
    const moderator = await requireModerator(request, env);
    const data = await request.formData();
    const artifactId = data.get('artifactId');
    const note = data.get('note');
    if (typeof artifactId !== 'string' || !artifactId)
      return fail(400, { message: 'Missing artifact.' });
    await publishArtifact(
      env.DB,
      env,
      artifactId,
      { type: 'moderator', id: moderator.id },
      'unpublish',
      typeof note === 'string' && note.trim() ? note.trim().slice(0, 1000) : null
    );
    return { success: true };
  }
};
