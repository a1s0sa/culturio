import { describe, expect, it } from 'vitest';
import { assetBaseFrom, artifactBySlug, filtersFor, listArtifacts } from './index.js';

describe('artifact media base URL', () => {
  it('adds HTTPS when the Worker variable contains only the custom domain', () => {
    expect(assetBaseFrom({ ASSET_BASE_URL: 'assets.culturio.africa' } as Cloudflare.Env)).toBe(
      'https://assets.culturio.africa'
    );
  });

  it('keeps a configured HTTPS URL and path', () => {
    expect(
      assetBaseFrom({ ASSET_BASE_URL: 'https://assets.culturio.africa/images/' } as Cloudflare.Env)
    ).toBe('https://assets.culturio.africa/images');
  });

  it('uses the Worker media route locally and for invalid or insecure hosts', () => {
    expect(
      assetBaseFrom(
        { ASSET_BASE_URL: 'assets.culturio.africa' } as Cloudflare.Env,
        new URL('http://localhost:8787')
      )
    ).toBe('/media');
    expect(
      assetBaseFrom({ ASSET_BASE_URL: 'http://assets.culturio.africa' } as Cloudflare.Env)
    ).toBe('/media');
    expect(assetBaseFrom({ ASSET_BASE_URL: 'not a host' } as Cloudflare.Env)).toBe('/media');
  });
});

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
