import type { D1HttpClient } from '../infrastructure/d1.js';
export interface ExistingSource {
  id: string;
  artifact_id: string;
  record_hash: string;
}
export async function findExactSource(
  client: D1HttpClient,
  source: string,
  externalId: string,
  signal?: AbortSignal
): Promise<ExistingSource | null> {
  return (
    (
      await client.query<ExistingSource>(
        'SELECT id, artifact_id, record_hash FROM artifact_sources WHERE institution = ? AND external_id = ? LIMIT 1',
        [source, externalId],
        signal
      )
    )[0] ?? null
  );
}
