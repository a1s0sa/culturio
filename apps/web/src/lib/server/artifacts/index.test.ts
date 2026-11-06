import { describe, expect, it } from 'vitest';
import { artifactBySlug, filtersFor, listArtifacts } from './index.js';
describe('artifact server boundary without a binding', () => {
  it('returns intentional empty data in local and build environments', async () => {
    await expect(listArtifacts(undefined, { sort: 'curated', limit: 24 })).resolves.toEqual({
      items: [],
      nextCursor: null
    });
    await expect(artifactBySlug(undefined, 'missing')).resolves.toBeNull();
    await expect(filtersFor(undefined)).resolves.toEqual({
      cultures: [],
      countries: [],
      types: [],
      periods: [],
      materials: []
    });
  });
});
