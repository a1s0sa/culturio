import type { PageServerLoad } from './$types';
import { dev } from '$app/env';
import { env } from 'cloudflare:workers';

export const load: PageServerLoad = () => ({
  showConstructionNotice: !dev && env.PUBLIC_MUSEUM_CONSTRUCTION_NOTICE === 'true'
});
