import { describe, expect, it } from 'vitest';
import { parseGallerySearchParams } from '../src/index.js';
describe('gallery URL state', () => {
  it('validates filters and sorting', () =>
    expect(
      parseGallerySearchParams(new URLSearchParams('q=benin&sort=oldest&limit=24'))
    ).toMatchObject({ q: 'benin', sort: 'oldest', limit: 24 }));
  it('falls back safely for malformed values', () =>
    expect(
      parseGallerySearchParams(new URLSearchParams('sort=DROP+TABLE&limit=5000'))
    ).toMatchObject({ sort: 'curated', limit: 24 }));
});
