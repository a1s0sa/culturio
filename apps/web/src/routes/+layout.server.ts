import { env } from 'cloudflare:workers';
import { createAuth } from '$lib/server/auth';
import { avatarForUser } from '$lib/server/auth/avatar';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request }) => {
  const session = await createAuth(env).api.getSession({ headers: request.headers });
  return {
    user: session?.user ? { ...session.user, avatar: avatarForUser(session.user.id) } : null
  };
};
