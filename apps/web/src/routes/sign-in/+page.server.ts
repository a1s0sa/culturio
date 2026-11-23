import { dev } from '$app/env';
import { env } from 'cloudflare:workers';
import type { PageServerLoad } from './$types';
import { safeReturnTo } from '$lib/auth/return-to';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
  if (!dev && env.PUBLIC_AUTH_ENABLED !== 'true') redirect(303, '/gallery');

  return {
    returnTo: safeReturnTo(url.searchParams.get('returnTo')),
    sent: url.searchParams.get('sent') === '1',
    error: url.searchParams.get('error')
  };
};
