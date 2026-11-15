import { readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { publishArtifact } from './moderation.js';

function d1(database: DatabaseSync): D1Database {
  return {
    prepare(sql: string) {
      let values: SQLInputValue[] = [];
      return {
        bind(...parameters: unknown[]) {
          values = parameters as SQLInputValue[];
          return {
            sql,
            values,
            async all() {
              return { results: database.prepare(sql).all(...values) };
            }
          };
        }
      };
    },
    async batch(statements: { sql: string; values: SQLInputValue[] }[]) {
      database.exec('BEGIN');
      try {
        const results = statements.map(({ sql, values }) => ({
          success: true,
          meta: database.prepare(sql).run(...values) as { changes: number }
        }));
        database.exec('COMMIT');
        return results;
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    }
  } as unknown as D1Database;
}

function bucket(): R2Bucket {
  const objects = new Map<string, Uint8Array>();
  return {
    async get(key: string) {
      const bytes = objects.get(key);
      if (!bytes) return null;
      return {
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(bytes);
            controller.close();
          }
        }),
        httpMetadata: { contentType: 'image/webp' }
      };
    },
    async put(key: string, body: ReadableStream | ArrayBuffer | ArrayBufferView | string) {
      objects.set(
        key,
        typeof body === 'string' ? new TextEncoder().encode(body) : new Uint8Array()
      );
      return {};
    },
    async delete(key: string) {
      objects.delete(key);
    }
  } as unknown as R2Bucket;
}

function fixture() {
  const database = new DatabaseSync(':memory:');
  for (const name of [
    '0000_foundation.sql',
    '0001_auth.sql',
    '0002_ingestion_jobs.sql',
    '0003_enum_validation.sql',
    '0004_met_discovery_cursor.sql',
    '0005_artifact_publication.sql'
  ]) {
    database.exec(
      readFileSync(
        new URL(`../../../../../packages/db/migrations/${name}`, import.meta.url),
        'utf8'
      )
    );
  }
  const now = Date.now();
  database
    .prepare('INSERT INTO user(id,name,email) VALUES(?,?,?)')
    .run('moderator', 'Moderator', 'moderator@example.test');
  database
    .prepare(
      "INSERT INTO artifacts(id,slug,title,publication_status) VALUES('artifact','mask','Mask','draft')"
    )
    .run();
  database
    .prepare(
      `INSERT INTO artifact_sources(id,artifact_id,institution,external_id,source_url,last_fetched_at,record_hash)
       VALUES('source','artifact','met','42','https://example.test/source',?,'hash')`
    )
    .run(now);
  database
    .prepare(
      `INSERT INTO artifact_images(id,artifact_id,source_id,original_url,original_object_key,
       redistribution_allowed,processed_at) VALUES('eligible','artifact','source','https://example.test/image',
       'artifact/original.webp',1,?)`
    )
    .run(now);
  database
    .prepare(
      `INSERT INTO image_variants(id,image_id,name,width,height,byte_size,mime_type,object_key)
       VALUES('variant','eligible','thumbnail',100,100,10,'image/webp','artifact/thumb.webp')`
    )
    .run();
  database
    .prepare(
      `INSERT INTO artifact_images(id,artifact_id,source_id,original_url,redistribution_allowed,publication_status)
       VALUES('restricted','artifact','source','https://example.test/restricted',1,'restricted')`
    )
    .run();
  return database;
}

describe('artifact moderation transitions', () => {
  it('publishes eligible images, preserves restricted images, audits, and unpublishes', async () => {
    const database = fixture();
    const db = d1(database);
    const env = { MEDIA: bucket(), UNPUBLISHED_MEDIA: bucket() };
    await env.UNPUBLISHED_MEDIA.put('artifact/thumb.webp', 'image');
    await publishArtifact(
      db,
      env,
      'artifact',
      'moderator',
      'publish',
      'Reviewed source and rights'
    );
    expect(
      database.prepare("SELECT publication_status FROM artifacts WHERE id='artifact'").get()
    ).toEqual({ publication_status: 'published' });
    expect(
      database.prepare("SELECT publication_status FROM artifact_images WHERE id='eligible'").get()
    ).toEqual({ publication_status: 'published' });
    expect(
      database.prepare("SELECT publication_status FROM artifact_images WHERE id='restricted'").get()
    ).toEqual({ publication_status: 'restricted' });
    expect(database.prepare('SELECT action,note FROM artifact_publication_events').get()).toEqual({
      action: 'publish',
      note: 'Reviewed source and rights'
    });

    await publishArtifact(db, env, 'artifact', 'moderator', 'unpublish', null);
    expect(
      database.prepare("SELECT publication_status FROM artifacts WHERE id='artifact'").get()
    ).toEqual({ publication_status: 'draft' });
    expect(
      database.prepare("SELECT publication_status FROM artifact_images WHERE id='eligible'").get()
    ).toEqual({ publication_status: 'draft' });
    expect(
      database.prepare('SELECT action FROM artifact_publication_events ORDER BY created_at').all()
    ).toHaveLength(2);
  });

  it('refuses publication without an eligible processed image', async () => {
    const database = fixture();
    database.prepare("UPDATE artifact_images SET processed_at=NULL WHERE id='eligible'").run();
    await expect(
      publishArtifact(
        d1(database),
        { MEDIA: bucket(), UNPUBLISHED_MEDIA: bucket() },
        'artifact',
        'moderator',
        'publish',
        null
      )
    ).rejects.toMatchObject({
      status: 409
    });
    expect(
      database.prepare('SELECT COUNT(*) count FROM artifact_publication_events').get()
    ).toEqual({ count: 0 });
    expect(
      database.prepare("SELECT publication_status FROM artifacts WHERE id='artifact'").get()
    ).toEqual({
      publication_status: 'draft'
    });
  });
});
