# Architecture

The SvelteKit Worker serves the application and runs ingestion through D1, Queue, Workflow, R2, and Cloudflare Images bindings. The small Node ingestion CLI only triggers the deployed Worker or runs maintenance tasks; it does not process artifact records or images.

Data flows from a source adapter through normalization, Zod validation, exact-source deduplication, licensing review, bounded media processing, deterministic R2 upload, and a batched D1 upsert. A failed artifact is isolated and recorded for review. Content-addressed object names make upload retries safe. Eligible completed records are published by a separate authenticated step that uses the same R2 copy, D1 transition, and audit logic as moderator publishing.

`@culturio/shared` owns boundary contracts, source adapters, and retry handling. `@culturio/db` owns relational schema and queries. The Worker owns ingestion side effects. There is no separate backend service or Redis deployment.

FTS5 uses `artifacts` as external content. Insert, update, and delete triggers synchronize indexed text, and `bm25` ranks only published artifacts.
