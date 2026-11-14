export const SOURCE_NAMES = ['met', 'smithsonian'] as const;
export const PUBLICATION_STATUSES = ['draft', 'review', 'published', 'restricted'] as const;
export const INGESTION_RUN_STATUSES = ['running', 'completed', 'failed', 'cancelled'] as const;
export const INGESTION_JOB_STATUSES = [
  'queued',
  'processing',
  'completed',
  'skipped',
  'failed',
  'review'
] as const;
export const INGESTION_JOB_RESULTS = ['inserted', 'updated', 'skipped'] as const;
export const REVIEW_RECORD_STATUSES = ['open', 'resolved', 'dismissed'] as const;
export const IMAGE_VARIANT_NAMES = ['thumbnail', 'medium', 'large'] as const;
export const GEOGRAPHY_CONFIDENCES = ['confirmed', 'ambiguous'] as const;
