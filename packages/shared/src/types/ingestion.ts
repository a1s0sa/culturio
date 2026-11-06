import type { NormalizedArtifact, SourceName } from '../schemas/artifact.js';

export interface SourceCheckpoint {
  cursor?: string;
  offset?: number;
  metadata?: Record<string, unknown>;
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

export interface IngestionMetrics {
  discovered: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  rejected: number;
  imagesProcessed: number;
  errors: number;
  sourceRequestMs: number[];
  imageProcessingMs: number[];
  uploadMs: number[];
  databaseWriteMs: number[];
  inputBytes: number;
  outputBytes: number;
}
