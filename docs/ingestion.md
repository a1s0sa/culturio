# Ingestion

Adapters implement discovery, record fetch, and source-specific normalization. Discovery checkpoints are persisted after a successfully handled record. The Met adapter uses the paginated v1.1 search endpoint; Smithsonian uses its authenticated Open Access search and content endpoints.

Africa classification uses explicit place, culture, civilization, and historical-region mappings. A bare textual occurrence of “Africa” is ambiguous, not proof. Add mapping terms conservatively and send uncertain records to review.

To add a museum, implement `SourceAdapter`, validate the remote response before normalization, preserve the complete source record, and add deterministic fixtures. Never map a remote field based only on a similarly named field from another museum.

Retries use exponential backoff with jitter and honor `Retry-After`. API, download, Sharp, upload, and D1 concurrency limits are independent. `--limit` counts handled records, not search results. `--dry-run` performs validation and media processing without D1/R2 writes.

Reports under `scripts/ingestion/reports` include throughput, latency, memory, byte totals, and compression savings. They are local artifacts and ignored by Git.
