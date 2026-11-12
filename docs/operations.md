# Operations

## Cloudflare setup

Create the D1 database and private R2 bucket named by the bindings in `apps/web/wrangler.jsonc`. The SvelteKit app reads Worker bindings from `cloudflare:workers`; local Vite development uses the Wrangler config and its persistent local D1 database. The ingestion process does not use those bindings: it uses a least-privilege Cloudflare token with D1 read/write plus bucket-scoped S3 credentials.

Configure `assets.culturio.africa` as an R2 custom domain only after reviewing approved objects. R2's S3 endpoint is not itself a CDN. Serve approved content with correct `Content-Type`; object keys are content-addressed and uploaded with `public, max-age=31536000, immutable`. Keep the bucket private to ingestion credentials and expose only the intended delivery path.

Required secrets are `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_D1_DATABASE_ID`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `SMITHSONIAN_API_KEY`. Never expose them through SvelteKit public environment variables.

For local auth, copy `apps/web/.dev.vars.example` to `apps/web/.dev.vars`, set a random `BETTER_AUTH_SECRET` and the local `BETTER_AUTH_URL`, then enter the ZeptoMail agent API key, regional email API URL, and verified sender address. Apply local migrations with `pnpm --filter @culturio/db migrate:local`. In production, set the auth secret and ZeptoMail API key as Wrangler secrets; configure the URL and sender values as Worker vars or secrets.

## Recovery

Resume with `pnpm ingest --source met --limit 100 --resume <run-id>`. Deterministic R2 keys make repeated uploads safe; D1 upserts use source identity. Review `review_records` for corrupt images, ambiguous geography, licensing, or per-record failures. A successful upload followed by a failed D1 write is reconciled by retrying the record; the same object key is reused.

The ingestion workflow is manual and prevents overlapping production runs. Begin with a dry run, then 10–20 records. Verify D1 rows, variants, licensing, search, repeat-run idempotency, and checkpoint recovery before increasing limits.

## Deployment

Keep the database name and ID in `wrangler.jsonc` aligned with the Cloudflare D1 resource, run `pnpm --filter @culturio/web cf-typegen` after changing bindings, then deploy with `pnpm --filter @culturio/web deploy`.
