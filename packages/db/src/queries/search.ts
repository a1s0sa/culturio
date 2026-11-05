export interface SearchResult { id: string; slug: string; title: string; description: string | null; score: number; }
export interface SearchOptions { page?: number; pageSize?: number; }

export function toFtsQuery(input: string): string {
  const terms = input.normalize('NFKC').match(/[\p{L}\p{N}]+/gu)?.slice(0, 12) ?? [];
  return terms.map((term) => `"${term.replaceAll('"', '""')}"*`).join(' AND ');
}

export async function searchArtifacts(database: D1Database, input: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const query = toFtsQuery(input);
  if (!query) return [];
  const pageSize = Math.min(Math.max(options.pageSize ?? 24, 1), 100);
  const offset = Math.max((options.page ?? 1) - 1, 0) * pageSize;
  const statement = database.prepare(`SELECT a.id, a.slug, a.title, a.description, bm25(artifacts_fts) AS score FROM artifacts_fts JOIN artifacts a ON a.rowid = artifacts_fts.rowid WHERE artifacts_fts MATCH ? AND a.publication_status = 'published' ORDER BY score LIMIT ? OFFSET ?`);
  const result = await statement.bind(query, pageSize, offset).all<SearchResult>();
  return result.results;
}
