export type { DiscoveredRecord, SourceAdapter, SourceCheckpoint } from '@culturio/shared';

export class SourceRecordError extends Error {
  constructor(readonly source: string, readonly externalId: string, message: string, readonly cause?: unknown) { super(message); }
}
