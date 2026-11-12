import { building } from '$app/env';
import { env } from 'cloudflare:workers';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { createAuth } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  if (building || !event.url.pathname.startsWith('/api/auth')) {
    return resolve(event);
  }

  if (!env.DB) {
    return new Response('Cloudflare D1 binding is unavailable', { status: 500 });
  }

  return svelteKitHandler({
    event,
    resolve,
    auth: createAuth(env),
    building
  });
};
