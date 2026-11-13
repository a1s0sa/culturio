import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ setHeaders }) => {
  setHeaders({ 'cache-control': 'public, max-age=3600', 'content-type': 'text/plain' });
  return new Response(
    'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://culturio.africa/sitemap.xml\n'
  );
};
