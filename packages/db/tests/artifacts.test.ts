import { describe, expect, it } from 'vitest';
import { getArtifacts } from '../src/queries/artifacts.js';

function database(rows: Record<string, unknown>[]): D1Database {
  return {
    prepare() {
      return {
        bind() {
          return { all: async () => ({ results: rows }) };
        }
      };
    }
  } as unknown as D1Database;
}
const row = {
  id: 'a1',
  slug: 'benin-plaque',
  title: 'Benin Plaque',
  search_cultures: 'Edo',
  search_civilizations: 'Kingdom of Benin',
  origin: 'Nigeria',
  historical_period: '16th century',
  date_display: '16th century',
  artifact_type: 'Plaque',
  quality_score: 0.9,
  created_at: 10,
  image_id: 'i1',
  image_width: 640,
  image_height: 900,
  dominant_color: '#765432',
  original_url: 'https://source.example/image',
  thumb_key: 'artifacts/a/320.webp',
  thumb_width: 320,
  medium_key: 'artifacts/a/640.webp',
  medium_width: 640,
  large_key: 'artifacts/a/1280.webp',
  large_width: 1280,
  large_height: 1800
};
describe('artifact discovery query', () => {
  it('builds responsive CDN image data and a stable next cursor', async () => {
    const page = await getArtifacts(
      database([row, { ...row, id: 'a2', slug: 'second' }]),
      { sort: 'curated', limit: 1 },
      'https://assets.example'
    );
    expect(page.items[0]?.image?.src).toBe('https://assets.example/artifacts/a/640.webp');
    expect(page.items[0]?.image?.srcset).toContain('1280w');
    expect(page.nextCursor).toBeTruthy();
  });
  it('omits a cursor at the end', async () => {
    const page = await getArtifacts(
      database([row]),
      { sort: 'alphabetical', limit: 24 },
      'https://assets.example/'
    );
    expect(page.nextCursor).toBeNull();
  });
});
