import { normalizedArtifactSchema, type NormalizedArtifact } from '@culturio/shared';
export function validateRecord(value: unknown): NormalizedArtifact {
  return normalizedArtifactSchema.parse(value);
}
