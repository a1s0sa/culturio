import { relations, sql } from 'drizzle-orm';
import { check, index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`)
};

export const artifacts = sqliteTable('artifacts', {
  id: text('id').primaryKey(), slug: text('slug').notNull().unique(), title: text('title').notNull(),
  alternativeNames: text('alternative_names', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  description: text('description'), artifactType: text('artifact_type'), origin: text('origin'),
  historicalPeriod: text('historical_period'), earliestYear: integer('earliest_year'), latestYear: integer('latest_year'),
  dateDisplay: text('date_display'), dateUncertain: integer('date_uncertain', { mode: 'boolean' }).notNull().default(false),
  materials: text('materials', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`), dimensions: text('dimensions'),
  publicationStatus: text('publication_status', { enum: ['draft', 'review', 'published', 'restricted'] }).notNull().default('draft'),
  qualityScore: real('quality_score').notNull().default(0), searchCultures: text('search_cultures').notNull().default(''),
  searchCivilizations: text('search_civilizations').notNull().default(''), ...timestamps
}, (table) => [index('artifacts_status_idx').on(table.publicationStatus), index('artifacts_period_idx').on(table.earliestYear, table.latestYear), check('artifacts_year_order', sql`${table.earliestYear} IS NULL OR ${table.latestYear} IS NULL OR ${table.earliestYear} <= ${table.latestYear}`)]);

export const artifactSources = sqliteTable('artifact_sources', {
  id: text('id').primaryKey(), artifactId: text('artifact_id').notNull().references(() => artifacts.id, { onDelete: 'cascade' }),
  institution: text('institution').notNull(), externalId: text('external_id').notNull(), sourceUrl: text('source_url').notNull(),
  accessionNumber: text('accession_number'), rawMetadata: text('raw_metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  rawMetadataKey: text('raw_metadata_key'), lastFetchedAt: integer('last_fetched_at', { mode: 'timestamp_ms' }).notNull(),
  attribution: text('attribution'), metadataLicense: text('metadata_license'), recordHash: text('record_hash').notNull(), ...timestamps
}, (table) => [uniqueIndex('artifact_sources_identity_uq').on(table.institution, table.externalId), index('artifact_sources_artifact_idx').on(table.artifactId), index('artifact_sources_hash_idx').on(table.recordHash)]);

export const artifactImages = sqliteTable('artifact_images', {
  id: text('id').primaryKey(), artifactId: text('artifact_id').notNull().references(() => artifacts.id, { onDelete: 'cascade' }),
  sourceId: text('source_id').notNull().references(() => artifactSources.id, { onDelete: 'cascade' }), originalUrl: text('original_url').notNull(),
  width: integer('width'), height: integer('height'), mimeType: text('mime_type'), dominantColor: text('dominant_color'),
  contentHash: text('content_hash'), originalObjectKey: text('original_object_key'), licenseIdentifier: text('license_identifier'),
  licenseUrl: text('license_url'), attribution: text('attribution'), redistributionAllowed: integer('redistribution_allowed', { mode: 'boolean' }).notNull().default(false),
  publicationStatus: text('publication_status', { enum: ['draft', 'review', 'published', 'restricted'] }).notNull().default('draft'),
  processedAt: integer('processed_at', { mode: 'timestamp_ms' }), ...timestamps
}, (table) => [uniqueIndex('artifact_images_source_url_uq').on(table.sourceId, table.originalUrl), index('artifact_images_hash_idx').on(table.contentHash), index('artifact_images_artifact_idx').on(table.artifactId)]);

export const imageVariants = sqliteTable('image_variants', {
  id: text('id').primaryKey(), imageId: text('image_id').notNull().references(() => artifactImages.id, { onDelete: 'cascade' }),
  name: text('name', { enum: ['thumbnail', 'medium', 'large'] }).notNull(), width: integer('width').notNull(), height: integer('height').notNull(),
  byteSize: integer('byte_size').notNull(), mimeType: text('mime_type').notNull(), objectKey: text('object_key').notNull().unique(), ...timestamps
}, (table) => [uniqueIndex('image_variants_image_name_uq').on(table.imageId, table.name)]);

export const cultures = sqliteTable('cultures', { id: text('id').primaryKey(), name: text('name').notNull().unique(), ...timestamps });
export const civilizations = sqliteTable('civilizations', { id: text('id').primaryKey(), name: text('name').notNull().unique(), ...timestamps });
export const artifactCultures = sqliteTable('artifact_cultures', { artifactId: text('artifact_id').notNull().references(() => artifacts.id, { onDelete: 'cascade' }), cultureId: text('culture_id').notNull().references(() => cultures.id, { onDelete: 'restrict' }) }, (table) => [primaryKey({ columns: [table.artifactId, table.cultureId] })]);
export const artifactCivilizations = sqliteTable('artifact_civilizations', { artifactId: text('artifact_id').notNull().references(() => artifacts.id, { onDelete: 'cascade' }), civilizationId: text('civilization_id').notNull().references(() => civilizations.id, { onDelete: 'restrict' }) }, (table) => [primaryKey({ columns: [table.artifactId, table.civilizationId] })]);

export const ingestionRuns = sqliteTable('ingestion_runs', {
  id: text('id').primaryKey(), source: text('source').notNull(), status: text('status', { enum: ['running', 'completed', 'failed', 'cancelled'] }).notNull(),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(), endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
  discovered: integer('discovered').notNull().default(0), processed: integer('processed').notNull().default(0), inserted: integer('inserted').notNull().default(0),
  updated: integer('updated').notNull().default(0), skipped: integer('skipped').notNull().default(0), rejected: integer('rejected').notNull().default(0),
  imagesProcessed: integer('images_processed').notNull().default(0), errors: integer('errors').notNull().default(0), report: text('report', { mode: 'json' }), ...timestamps
});
export const ingestionCheckpoints = sqliteTable('ingestion_checkpoints', {
  id: text('id').primaryKey(), runId: text('run_id').notNull().references(() => ingestionRuns.id, { onDelete: 'cascade' }), source: text('source').notNull(),
  cursor: text('cursor'), state: text('state', { mode: 'json' }).$type<Record<string, unknown>>().notNull(), processedExternalId: text('processed_external_id'), ...timestamps
}, (table) => [uniqueIndex('ingestion_checkpoints_run_source_uq').on(table.runId, table.source)]);
export const reviewRecords = sqliteTable('review_records', {
  id: text('id').primaryKey(), runId: text('run_id').references(() => ingestionRuns.id, { onDelete: 'set null' }), source: text('source').notNull(), externalId: text('external_id'),
  artifactId: text('artifact_id').references(() => artifacts.id, { onDelete: 'set null' }), reasonCode: text('reason_code').notNull(), reason: text('reason').notNull(),
  payload: text('payload', { mode: 'json' }), status: text('status', { enum: ['open', 'resolved', 'dismissed'] }).notNull().default('open'), ...timestamps
}, (table) => [index('review_records_status_idx').on(table.status)]);

export const artifactsRelations = relations(artifacts, ({ many }) => ({ sources: many(artifactSources), images: many(artifactImages), cultures: many(artifactCultures), civilizations: many(artifactCivilizations) }));
