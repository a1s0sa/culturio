# Database Schema Guide

The database is SQLite on Cloudflare D1. The Drizzle definitions in `packages/db/src/schema/` describe the tables and TypeScript types; ordered SQL migrations in `packages/db/migrations/` create and evolve the deployed schema. Apply migrations before running the app against a local or remote D1 database.

## Collections and provenance

- `artifacts` stores the canonical display record, including title, description, date bounds, materials, publication status, and denormalized search text. `earliest_year` and `latest_year` are numeric bounds; `date_display` preserves the institution's wording.
- `artifact_sources` stores each institution's record for an artifact: institution key, external ID, source URL, accession number, metadata attribution/license, and an optional raw metadata copy or object key. `(institution, external_id)` is unique, so records from different institutions are not automatically merged.
- `artifact_images` stores image URLs and processing state, linking to both the artifact and its source record. Image attribution and license fields are separate from metadata attribution. Redistribution permission defaults to false.
- `image_variants` stores generated thumbnail, medium, and large files with their dimensions, byte sizes, MIME types, and object keys.
- `cultures` and `civilizations` are normalized vocabularies. `artifact_cultures` and `artifact_civilizations` provide many-to-many links.

## Ingestion and review

- `ingestion_runs` records a source import and its counters/status.
- `ingestion_checkpoints` stores resumable cursor/state per run and source.
- `ingestion_jobs` tracks each discovered external record, its attempts, status, result, and failure reason.
- `ingestion_discovery_state` persists source-level discovery offsets and request timing.
- `review_records` stores metadata, geography, and rights issues that need a human decision. Run and artifact links are nullable so review history can survive deletion of those records.

## Authentication and search

`user`, `session`, `account`, and `verification` are Better Auth tables. Sessions and accounts reference users; verification records are keyed by identifier and do not have a user foreign key. `artifacts_fts` is an FTS5 virtual table maintained by artifact insert, update, and delete triggers; rebuild it with `pnpm db:rebuild-search` after restoring a database export that omits virtual tables.

## Enums, JSON, and integrity

SQLite has no native enum type. Shared constants define the allowed source institutions (`met`, `smithsonian`), publication/run/job/review statuses, job results, and image variant names. Drizzle uses these as TypeScript unions. SQL `CHECK` constraints enforce the existing status and variant sets; migration `0003_enum_validation.sql` adds database validation triggers for institutions, ingestion sources, and job status/results.

Some columns are JSON text: artifact alternative names and materials, source raw metadata, checkpoint state, run reports, and review payloads. Foreign keys generally cascade with their owning artifact or run; culture/vocabulary links and review records preserve data using restrictive or nullable references where needed.

When adding an enum value, update `packages/shared/src/constants/enums.ts`, any matching Zod schema, the Drizzle enum declaration, and the database migration that enforces it. Never edit an already-applied migration to change a deployed database; add a new numbered migration instead.
