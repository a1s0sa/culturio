import {
  getArtifactBySlug,
  getArtifactFilters,
  getArtifacts,
  getFeaturedArtifacts
} from '@culturio/db';
import type { GalleryQuery } from '@culturio/shared';

export const DEFAULT_ASSET_BASE = 'https://assets.culturio.africa';
export function databaseFrom(env: Cloudflare.Env | undefined): D1Database | null {
  return env?.DB ?? null;
}
export function assetBaseFrom(env: Cloudflare.Env | undefined): string {
  return env?.ASSET_BASE_URL ?? DEFAULT_ASSET_BASE;
}
export async function listArtifacts(env: Cloudflare.Env | undefined, query: GalleryQuery) {
  const db = databaseFrom(env);
  return db ? getArtifacts(db, query, assetBaseFrom(env)) : { items: [], nextCursor: null };
}
export async function artifactBySlug(env: Cloudflare.Env | undefined, slug: string) {
  const db = databaseFrom(env);
  return db ? getArtifactBySlug(db, slug, assetBaseFrom(env)) : null;
}
export async function filtersFor(env: Cloudflare.Env | undefined) {
  const db = databaseFrom(env);
  return db
    ? getArtifactFilters(db)
    : { cultures: [], countries: [], types: [], periods: [], materials: [] };
}
export async function featuredArtifacts(env: Cloudflare.Env | undefined, limit = 6) {
  const db = databaseFrom(env);
  return db ? getFeaturedArtifacts(db, assetBaseFrom(env), limit) : [];
}
