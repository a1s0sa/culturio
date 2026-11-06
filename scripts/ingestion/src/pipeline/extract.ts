import type { SourceAdapter } from '@culturio/shared';
export async function extractRecord(
  adapter: SourceAdapter<any>,
  externalId: string,
  signal?: AbortSignal
): Promise<unknown> {
  return adapter.fetchRecord(externalId, signal);
}
