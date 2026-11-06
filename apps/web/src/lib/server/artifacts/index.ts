import {
  getArtifactBySlug,
  getArtifactFilters,
  getArtifacts,
  getFeaturedArtifacts
} from '@culturio/db';
import type { GalleryQuery } from '@culturio/shared';

export const DEFAULT_ASSET_BASE = 'https://assets.culturio.africa';
export function databaseFrom(platform: App.Platform | undefined): D1Database | null {
  return platform?.env.DB ?? null;
}
export function assetBaseFrom(platform: App.Platform | undefined): string {
  return platform?.env.ASSET_BASE_URL ?? DEFAULT_ASSET_BASE;
}
export async function listArtifacts(platform: App.Platform | undefined, query: GalleryQuery) {
  const db = databaseFrom(platform);
  return db ? getArtifacts(db, query, assetBaseFrom(platform)) : { items: [], nextCursor: null };
}
export async function artifactBySlug(platform: App.Platform | undefined, slug: string) {
  const db = databaseFrom(platform);
  return db ? getArtifactBySlug(db, slug, assetBaseFrom(platform)) : null;
}
export async function filtersFor(platform: App.Platform | undefined) {
  const db = databaseFrom(platform);
  return db
    ? getArtifactFilters(db)
    : { cultures: [], countries: [], types: [], periods: [], materials: [] };
}
export async function featuredArtifacts(platform: App.Platform | undefined, limit = 6) {
  const db = databaseFrom(platform);
  return db ? getFeaturedArtifacts(db, assetBaseFrom(platform), limit) : [];
}
