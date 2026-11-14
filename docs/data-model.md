# Data model

See [Database Schema Guide](database-schema.md) for the current table groups, relationships, enum values, and migration notes.

`artifacts` contains canonical display data and uncertain integer year bounds; negative values represent BCE. Approximate source text is preserved in `date_display`, with `date_uncertain` preventing false precision.

`artifact_sources` owns museum identity and provenance. `(institution, external_id)` is unique and is the only automatic identity merge. Similar titles never merge across institutions. Cultures and civilizations use many-to-many joins. Images and variants are separate so responsive dimensions and byte sizes require no runtime inspection.

Ingestion runs, checkpoints, and review records provide operational history and resumability. Foreign keys use conservative delete behavior. The initial migration includes indexes, constraints, FTS triggers, and an initial rebuild.

Apply locally before remote rollout:

```bash
pnpm --filter @culturio/db migrate:local
pnpm --filter @culturio/db migrate
```

D1 supports FTS5, but database exports containing virtual tables require the documented drop/recreate workaround. Rebuild with `pnpm db:rebuild-search`.
