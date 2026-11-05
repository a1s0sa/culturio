import type { NormalizedArtifact, SourceAdapter } from '@culturio/shared';
export async function normalizeRecord(adapter: SourceAdapter<any>, raw: unknown): Promise<NormalizedArtifact> { return adapter.normalize(raw); }
