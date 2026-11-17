# Operations

## Cloudflare setup

Create the D1 database and both R2 buckets named by the bindings in `apps/web/wrangler.jsonc`. `MEDIA` (`culturio-media`) is the public asset bucket and must contain only approved, redistributable image variants. `UNPUBLISHED_MEDIA` (`culturio-unpublished`) is private and holds ingestion metadata, originals, and staged variants. R2 custom domains expose the whole attached bucket; prefixes do not create access controls.

The Worker reads both R2 buckets through bindings. Local requests use the `/media` Worker route and Wrangler's local bucket bindings. In production, published gallery images use the `ASSET_BASE_URL` Worker variable when configured; point it at the custom domain attached to `culturio-media`. Without that variable, published and moderator preview requests use `/media`. Draft previews always use `/media`, which checks moderator access before reading `UNPUBLISHED_MEDIA`.

The one-time bucket visibility migration uses the R2 S3 API. Set `R2_BUCKET_NAME=culturio-unpublished` and `R2_PUBLIC_BUCKET_NAME=culturio-media` alongside Cloudflare D1 and R2 credentials in your shell. Review the dry-run, then run the migration to retain only published variants in the public bucket and move all other objects to the private bucket. It copies and verifies each object before deleting its source:

```sh
pnpm --filter @culturio/ingestion media:migrate-visibility
pnpm --filter @culturio/ingestion media:migrate-visibility -- --apply
```

Do not enable or leave the `culturio-media` custom domain attached until that migration has completed; known unpublished object keys are otherwise publicly fetchable. Afterward, purge the custom domain's Cloudflare cache so previously cached unpublished objects are removed. The `IMAGES` binding transforms image bytes during ingestion; it is not the storage bucket or CDN.

The GitHub remote-ingestion workflow needs the `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `INGESTION_TRIGGER_SECRET`, and `INGESTION_AUTOPUBLISH_SECRET` repository secrets, plus the `CULTURIO_WORKER_URL` repository variable. The Cloudflare Worker itself needs `SMITHSONIAN_API_KEY`, `INGESTION_TRIGGER_SECRET`, and `INGESTION_AUTOPUBLISH_SECRET` as Wrangler secrets. Never put these values in public SvelteKit variables.

For local auth, copy `apps/web/.dev.vars.example` to `apps/web/.dev.vars`, set a random `BETTER_AUTH_SECRET` and the local `BETTER_AUTH_URL`, then enter the ZeptoMail agent API key, regional email API URL, and verified sender address. Apply local migrations with `pnpm --filter @culturio/db migrate:local`. In production, set the auth secret and ZeptoMail API key as Wrangler secrets; configure the URL and sender values as Worker vars or secrets.

## Grant moderator access

Create the person's account through the normal sign-in flow and verify the account identity before granting access. Then run this statement against the production D1 database using the Wrangler D1 console or `wrangler d1 execute`:

```sql
UPDATE `user` SET role = 'moderator' WHERE email = 'moderator@example.org';
```

New accounts receive the `member` role, and role assignment is server-controlled. To revoke moderation, set the account role back to `member`. Moderator changes and artifact publish/unpublish actions are recorded in D1.

## Trigger Cloudflare ingestion

Ingestion discovery is triggered with an authenticated HTTP request. It publishes
jobs to the `culturio-ingest` Queue; the Queue consumer starts an
`IngestionWorkflow` for each job. Create the queues once, then deploy the Worker
so Wrangler provisions the configured Workflow:

```sh
pnpm --dir apps/web exec wrangler queues create culturio-ingest
pnpm --dir apps/web exec wrangler queues create culturio-ingest-dlq
pnpm --filter @culturio/web deploy
```

Set bearer tokens for discovery and automated publication:

```sh
pnpm --dir apps/web exec wrangler secret put INGESTION_TRIGGER_SECRET
pnpm --dir apps/web exec wrangler secret put INGESTION_AUTOPUBLISH_SECRET
```

For local runs, put `INGESTION_TRIGGER_SECRET=local-development-token` in
`apps/web/.dev.vars`, then start the local Worker:

```sh
pnpm --filter @culturio/web dev:worker
```

From another terminal, send a small discovery request. Replace the URL with the
deployed Worker URL for production; use the matching local or deployed secret.

```sh
curl -X POST http://localhost:8787/api/ingestion/discover \
  -H 'authorization: Bearer local-development-token' \
  -H 'content-type: application/json' \
  -d '{"source":"met","limit":5}'
```

Use `"source":"smithsonian"` or `"source":"all"` to select other sources;
the endpoint accepts a maximum of 20 jobs per source per request. It returns a
run ID after publishing. Processing then happens asynchronously. Check Queue
depth, Workflow instances, and the D1 `ingestion_jobs` / `ingestion_runs` tables
to follow progress. Discovery makes live museum API requests.

The image workflow requires the `MEDIA`, `UNPUBLISHED_MEDIA`, and `IMAGES` bindings to be enabled
in `apps/web/wrangler.jsonc`; restore those bindings before expecting jobs to
finish image storage and processing.

## Recovery

Trigger a new scan with `pnpm ingest --source met --limit 20`; discovery cooldowns and checkpoints prevent immediately repeating the same records. Retry a failed Workflow instance with Wrangler after reviewing its failure reason. Deterministic R2 keys make retries safe; D1 upserts use source identity. Review `review_records` for ambiguous geography, licensing, or source failures.

The GitHub remote-ingestion workflow is manually dispatched and serializes production runs. It selects one museum and queues up to 20 eligible records per run, scanning onward until it fills that limit or reaches the end of the source. It waits for Workflow completion before publishing eligible records.

## Deployment

Keep the database name and ID in `wrangler.jsonc` aligned with the Cloudflare D1 resource, run `pnpm --filter @culturio/web cf-typegen` after changing bindings, then deploy with `pnpm --filter @culturio/web deploy`.
