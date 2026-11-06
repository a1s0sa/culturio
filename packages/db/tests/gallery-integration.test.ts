import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { getArtifactBySlug, getArtifactFilters, getArtifacts } from '../src/queries/artifacts.js';

function d1(database: DatabaseSync): D1Database {
  return {
    prepare(sql: string) {
      let values: SQLInputValue[] = [];
      return {
        bind(...parameters: unknown[]) {
          values = parameters as SQLInputValue[];
          return this;
        },
        async all<T>() {
          return { results: database.prepare(sql).all(...values) as T[], success: true, meta: {} };
        }
      };
    }
  } as unknown as D1Database;
}

function fixtureDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  database.exec(
    readFileSync(new URL('../migrations/0000_foundation.sql', import.meta.url), 'utf8')
  );
  const now = Date.now();
  const insert = database.prepare(
    `INSERT INTO artifacts(id,slug,title,description,artifact_type,origin,historical_period,earliest_year,latest_year,date_display,materials,publication_status,quality_score,search_cultures,search_civilizations,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  insert.run(
    'a1',
    'benin-plaque',
    'Benin Plaque',
    'An artifact test fixture based on source-shaped fields.',
    'Plaque',
    'Nigeria',
    '16th century',
    1500,
    1599,
    '16th century',
    '["Bronze"]',
    'published',
    0.9,
    'Edo',
    'Kingdom of Benin',
    now,
    now
  );
  insert.run(
    'a2',
    'yoruba-mask',
    'Yoruba Mask',
    'A second artifact fixture.',
    'Mask',
    'Nigeria',
    '19th century',
    1800,
    1899,
    '19th century',
    '["Wood"]',
    'published',
    0.8,
    'Yoruba',
    '',
    now - 1,
    now - 1
  );
  database
    .prepare('INSERT INTO cultures(id,name,created_at,updated_at) VALUES(?,?,?,?)')
    .run('c1', 'Edo', now, now);
  database
    .prepare('INSERT INTO artifact_cultures(artifact_id,culture_id) VALUES(?,?)')
    .run('a1', 'c1');
  database
    .prepare(
      `INSERT INTO artifact_sources(id,artifact_id,institution,external_id,source_url,last_fetched_at,record_hash,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`
    )
    .run('s1', 'a1', 'met', '1', 'https://example.test/source', now, 'hash', now, now);
  database
    .prepare(
      `INSERT INTO artifact_images(id,artifact_id,source_id,original_url,width,height,dominant_color,original_object_key,redistribution_allowed,publication_status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      'i1',
      'a1',
      's1',
      'https://example.test/image',
      640,
      900,
      '#765432',
      'artifacts/a1/hash/original.jpg',
      1,
      'published',
      now,
      now
    );
  for (const [name, width, height] of [
    ['thumbnail', 320, 450],
    ['medium', 640, 900],
    ['large', 1280, 1800]
  ] as const)
    database
      .prepare(
        `INSERT INTO image_variants(id,image_id,name,width,height,byte_size,mime_type,object_key,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        `v-${name}`,
        'i1',
        name,
        width,
        height,
        100,
        'image/webp',
        `artifacts/a1/hash/${width}.webp`,
        now,
        now
      );
  return database;
}

describe('gallery queries against the migration', () => {
  it('loads filters, responsive media, details, and related records', async () => {
    const database = d1(fixtureDatabase());
    const filters = await getArtifactFilters(database);
    expect(filters.cultures).toContain('Edo');
    expect(filters.materials).toContain('Bronze');
    const page = await getArtifacts(
      database,
      { sort: 'curated', limit: 24 },
      'https://assets.example'
    );
    expect(page.items[0]?.image?.srcset).toContain('1280w');
    const detail = await getArtifactBySlug(database, 'benin-plaque', 'https://assets.example');
    expect(detail?.sources[0]?.institution).toBe('met');
    expect(detail?.related[0]?.slug).toBe('yoruba-mask');
  });
  it('paginates ranked FTS results without duplicates', async () => {
    const database = d1(fixtureDatabase());
    const first = await getArtifacts(
      database,
      { q: 'artifact', sort: 'curated', limit: 1 },
      'https://assets.example'
    );
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).toBeTruthy();
    const second = await getArtifacts(
      database,
      { q: 'artifact', sort: 'curated', limit: 1, cursor: first.nextCursor! },
      'https://assets.example'
    );
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });
});
