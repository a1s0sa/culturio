import { building } from '$app/env';
import { env } from 'cloudflare:workers';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { createAuth } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  let response: Response;

  if (!building && event.url.pathname.startsWith('/api/auth')) {
    if (!env.DB) {
      return new Response('Cloudflare D1 binding is unavailable', { status: 500 });
    }

    response = await svelteKitHandler({
      event,
      resolve,
      auth: createAuth(env),
      building
    });
  } else {
    response = await resolve(event);
  }

  if (response.headers.get('content-type')?.includes('text/html')) {
    response.headers.set('cache-control', 'private, no-store');
  }

  return response;
};
