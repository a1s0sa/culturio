# Operations

## Cloudflare setup

Create a D1 database and private R2 bucket. Add a D1 binding named `DB` and an R2 binding named `MEDIA` to `apps/web/wrangler.jsonc` after resource provisioning. The ingestion process does not use those bindings: it uses a least-privilege Cloudflare token with D1 read/write plus bucket-scoped S3 credentials.

Configure `assets.culturio.africa` as an R2 custom domain only after reviewing approved objects. R2's S3 endpoint is not itself a CDN. Serve approved content with correct `Content-Type`; object keys are content-addressed and uploaded with `public, max-age=31536000, immutable`. Keep the bucket private to ingestion credentials and expose only the intended delivery path.

Required secrets are `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_D1_DATABASE_ID`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `SMITHSONIAN_API_KEY`. Never expose them through SvelteKit public environment variables.

## Recovery

Resume with `pnpm ingest --source met --limit 100 --resume <run-id>`. Deterministic R2 keys make repeated uploads safe; D1 upserts use source identity. Review `review_records` for corrupt images, ambiguous geography, licensing, or per-record failures. A successful upload followed by a failed D1 write is reconciled by retrying the record; the same object key is reused.

The ingestion workflow is manual and prevents overlapping production runs. Begin with a dry run, then 10–20 records. Verify D1 rows, variants, licensing, search, repeat-run idempotency, and checkpoint recovery before increasing limits.

## Known deployment step

No resource identifiers belong in source control. Consequently `wrangler.jsonc` contains no bindings initially. Add environment-specific bindings after provisioning, run `pnpm --filter @culturio/web cf-typegen`, then deploy with `pnpm --filter @culturio/web deploy`.
