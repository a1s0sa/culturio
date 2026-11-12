import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const database = new DatabaseSync(':memory:');
for (const migration of ['0000_foundation.sql', '0001_auth.sql', '0002_ingestion_jobs.sql']) {
  database.exec(readFileSync(new URL(`../migrations/${migration}`, import.meta.url), 'utf8'));
}
const now = Date.now();
database
  .prepare(
    'INSERT INTO artifacts(id,slug,title,publication_status,created_at,updated_at) VALUES(?,?,?,?,?,?)'
  )
  .run('validation', 'validation', 'Yoruba mask', 'published', now, now);
const indexed = database
  .prepare(
    `SELECT a.id FROM artifacts_fts JOIN artifacts a ON a.rowid=artifacts_fts.rowid WHERE artifacts_fts MATCH ? AND a.publication_status='published' ORDER BY bm25(artifacts_fts)`
  )
  .all('"Yoruba"*');
if (indexed.length !== 1) throw new Error('FTS insert synchronization failed');
database.prepare('UPDATE artifacts SET title=? WHERE id=?').run('Benin plaque', 'validation');
if (
  database.prepare('SELECT rowid FROM artifacts_fts WHERE artifacts_fts MATCH ?').all('"Benin"*')
    .length !== 1
)
  throw new Error('FTS update synchronization failed');
database.prepare('DELETE FROM artifacts WHERE id=?').run('validation');
if (
  database.prepare('SELECT rowid FROM artifacts_fts WHERE artifacts_fts MATCH ?').all('"Benin"*')
    .length !== 0
)
  throw new Error('FTS delete synchronization failed');
console.log('D1-compatible migration and FTS triggers are valid');
