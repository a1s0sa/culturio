# Architecture

The SvelteKit Worker is the future read-facing application. It may use D1 and R2 bindings but never contains ingestion credentials. The Node ingestion workspace operates independently through the authenticated D1 HTTP API and R2's S3-compatible API.

Data flows from a source adapter through normalization, Zod validation, exact-source deduplication, licensing review, bounded media processing, deterministic R2 upload, and a batched D1 upsert. A failed artifact is isolated and recorded for review. Content-addressed object names make upload retries safe.

`@culturio/shared` owns boundary contracts. `@culturio/db` owns relational schema and queries. `@culturio/ingestion` owns all source and media side effects. There is no backend service, queue, Redis deployment, or dependency on the web app being deployed.

FTS5 uses `artifacts` as external content. Insert, update, and delete triggers synchronize indexed text, and `bm25` ranks only published artifacts.
