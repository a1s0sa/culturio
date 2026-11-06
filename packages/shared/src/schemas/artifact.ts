import { z } from 'zod';

export const sourceNameSchema = z.enum(['met', 'smithsonian']);
export const publicationStatusSchema = z.enum(['draft', 'review', 'published', 'restricted']);
export const licenseSchema = z.object({
  identifier: z.string().trim().min(1).nullable(),
  url: z.url().nullable(),
  attribution: z.string().trim().nullable(),
  redistributionAllowed: z.boolean(),
  metadataRights: z.string().trim().nullable()
});

export const normalizedImageSchema = z.object({
  sourceUrl: z.url(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  mimeType: z
    .string()
    .regex(/^image\//)
    .nullable(),
  license: licenseSchema
});

export const normalizedArtifactSchema = z
  .object({
    source: sourceNameSchema,
    externalId: z.string().trim().min(1),
    sourceUrl: z.url(),
    accessionNumber: z.string().trim().nullable(),
    title: z.string().trim().min(1),
    alternativeNames: z.array(z.string().trim().min(1)).default([]),
    description: z.string().trim().nullable(),
    artifactType: z.string().trim().nullable(),
    cultures: z.array(z.string().trim().min(1)).default([]),
    civilizations: z.array(z.string().trim().min(1)).default([]),
    origin: z.string().trim().nullable(),
    historicalPeriod: z.string().trim().nullable(),
    earliestYear: z.number().int().min(-100000).max(3000).nullable(),
    latestYear: z.number().int().min(-100000).max(3000).nullable(),
    dateDisplay: z.string().trim().nullable(),
    dateUncertain: z.boolean().default(false),
    materials: z.array(z.string().trim().min(1)).default([]),
    dimensions: z.string().trim().nullable(),
    images: z.array(normalizedImageSchema).default([]),
    sourceAttribution: z.string().trim().nullable(),
    metadataLicense: z.string().trim().nullable(),
    raw: z.record(z.string(), z.unknown()),
    geographyConfidence: z.enum(['confirmed', 'ambiguous'])
  })
  .refine(
    (value) =>
      value.earliestYear === null ||
      value.latestYear === null ||
      value.earliestYear <= value.latestYear,
    {
      message: 'earliestYear must not be after latestYear'
    }
  );

export type NormalizedArtifact = z.infer<typeof normalizedArtifactSchema>;
export type NormalizedImage = z.infer<typeof normalizedImageSchema>;
export type SourceName = z.infer<typeof sourceNameSchema>;
