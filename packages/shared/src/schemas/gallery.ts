import { z } from 'zod';

export const gallerySortSchema = z.enum(['curated', 'oldest', 'newest', 'recent', 'alphabetical']);
const optionalFilter = z.string().trim().max(120).optional().catch(undefined);

export const galleryQuerySchema = z.object({
  q: z.string().trim().max(160).optional().catch(undefined),
  culture: optionalFilter,
  country: optionalFilter,
  type: optionalFilter,
  period: optionalFilter,
  material: optionalFilter,
  sort: gallerySortSchema.default('curated').catch('curated'),
  cursor: z.string().max(1000).optional().catch(undefined),
  limit: z.coerce.number().int().min(1).max(48).default(24).catch(24)
});

export type GalleryQuery = z.infer<typeof galleryQuerySchema>;
export type GallerySort = z.infer<typeof gallerySortSchema>;

export function parseGallerySearchParams(params: URLSearchParams): GalleryQuery {
  return galleryQuerySchema.parse(Object.fromEntries(params));
}
