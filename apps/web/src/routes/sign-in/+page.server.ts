import type { PageServerLoad } from './$types';
import { safeReturnTo } from '$lib/auth/return-to';

export const load: PageServerLoad = async ({ url }) => {
  return {
    returnTo: safeReturnTo(url.searchParams.get('returnTo')),
    sent: url.searchParams.get('sent') === '1',
    error: url.searchParams.get('error')
  };
};
