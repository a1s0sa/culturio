import type { NormalizedArtifact, SourceName } from '../schemas/artifact.js';

export interface SourceCheckpoint {
  cursor?: string;
  offset?: number;
}
export interface DiscoveredRecord {
  source: SourceName;
  externalId: string;
  checkpoint: SourceCheckpoint;
}
export interface SourceAdapter<TRaw = unknown> {
  readonly source: SourceName;
  discover(checkpoint: SourceCheckpoint, signal?: AbortSignal): AsyncIterable<DiscoveredRecord>;
  fetchRecord(id: string, signal?: AbortSignal): Promise<TRaw>;
  normalize(record: TRaw): Promise<NormalizedArtifact>;
}
