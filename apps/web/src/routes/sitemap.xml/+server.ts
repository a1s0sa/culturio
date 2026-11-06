import type { RequestHandler } from './$types';
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!
  );
export const GET: RequestHandler = async ({ platform, setHeaders }) => {
  const staticPaths = ['', 'gallery', 'about', 'museum'];
  const rows = platform?.env.DB
    ? (
        await platform.env.DB.prepare(
          "SELECT slug,updated_at FROM artifacts WHERE publication_status='published' ORDER BY slug"
        ).all<{ slug: string; updated_at: number }>()
      ).results
    : [];
  const urls = [
    ...staticPaths.map((path) => `<url><loc>https://culturio.africa/${path}</loc></url>`),
    ...rows.map(
      (row) =>
        `<url><loc>https://culturio.africa/artifacts/${escape(row.slug)}</loc><lastmod>${new Date(row.updated_at).toISOString()}</lastmod></url>`
    )
  ].join('');
  setHeaders({
    'cache-control': 'public, max-age=3600, s-maxage=3600',
    'content-type': 'application/xml'
  });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
  );
};
