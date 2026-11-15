import {
  getArtifactBySlug,
  getArtifactFilters,
  getArtifacts,
  getFeaturedArtifacts
} from '@culturio/db';
import type { GalleryQuery } from '@culturio/shared';

const MEDIA_BASE = '/media';
export function databaseFrom(env: Cloudflare.Env | undefined): D1Database | null {
  return env?.DB ?? null;
}
export function assetBaseFrom(env: Cloudflare.Env | undefined, requestUrl?: URL): string {
  if (requestUrl && ['localhost', '127.0.0.1', '[::1]'].includes(requestUrl.hostname))
    return MEDIA_BASE;
  return env?.ASSET_BASE_URL?.replace(/\/$/, '') || MEDIA_BASE;
}
export async function listArtifacts(
  env: Cloudflare.Env | undefined,
  query: GalleryQuery,
  requestUrl?: URL
) {
  const db = databaseFrom(env);
  return db
    ? getArtifacts(db, query, assetBaseFrom(env, requestUrl))
    : { items: [], nextCursor: null };
}
export async function artifactBySlug(
  env: Cloudflare.Env | undefined,
  slug: string,
  requestUrl?: URL
) {
  const db = databaseFrom(env);
  return db ? getArtifactBySlug(db, slug, assetBaseFrom(env, requestUrl)) : null;
}
export async function filtersFor(env: Cloudflare.Env | undefined) {
  const db = databaseFrom(env);
  return db
    ? getArtifactFilters(db)
    : { cultures: [], countries: [], types: [], periods: [], materials: [] };
}
export async function featuredArtifacts(
  env: Cloudflare.Env | undefined,
  limit = 6,
  requestUrl?: URL
) {
  const db = databaseFrom(env);
  return db ? getFeaturedArtifacts(db, assetBaseFrom(env, requestUrl), limit) : [];
}
