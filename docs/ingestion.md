# Ingestion

## Runtime and flow

Production ingestion runs in the deployed Cloudflare Worker. The authenticated
`POST /api/ingestion/discover` endpoint reads durable source state, calls the
Met or Smithsonian discovery adapter, stores job/run state in D1, and publishes
bounded batches to `culturio-ingest`. Met search terms match any object data,
so discovery fetches candidate metadata and checks its origin and image list
before queueing it. It queues only origin-confirmed records with at least one
redistributable image. Confirmed Met metadata is cached in R2 for the Workflow
to reuse. Discovery does not download or process artifact images.

Each discovery request scans at most 20 source IDs and queues at most 20
records. A source with few eligible records may queue fewer than 20; its cursor
still advances across the scanned IDs. D1-known records are only queued again after 30 days, allowing changed
source records to be refreshed without creating a Workflow for every already
ingested ID on each pass. Open review records are left for review, and recently
failed jobs have a six-hour discovery cooldown. When a source scan reaches the end, its offset resets
to zero for the next incremental sweep; the adapters do not expose a reliable
source-side updated-since cursor.

The Queue consumer validates each message and creates one `IngestionWorkflow`
instance. Its `job_<sha256-prefix>` ID is deterministic for that discovered
record and run. A repeated delivery confirms the existing instance and ACKs;
transient Workflow creation errors are retried by Queues. Invalid messages are
retried up to the configured limit and then sent to `culturio-ingest-dlq`.
Met records with missing or ambiguous African origin, missing images, invalid
metadata, or a source 404 are recorded for review before a Workflow is created.
The Workflow also records permanent metadata failures and sends those jobs to
the DLQ after marking them failed in D1.

Each Workflow runs durable steps for metadata retrieval and normalization,
duplicate detection, image storage, D1 persistence, and job completion. Source
adapters, schemas, geography classification, date parsing, licensing rules,
and deterministic database identities are shared from `@culturio/shared`.
The normalized metadata is temporarily held in R2 and steps pass its key rather
than large raw records. Images are downloaded only for records whose license
permits redistribution. The original is stored unchanged; Cloudflare Images
produces WebP variants at 320, 640, and 1280 pixels. Image processing is bounded
to 20 MiB and 80 megapixels. Unsupported content or invalid image hosts are
skipped and logged; source and D1 failures are retried by Workflow steps.
Museum API requests reserve source-specific slots in D1 (350 ms for the Met,
one second for Smithsonian), shared across discovery and Workflow instances.
Existing retry handling honors each API's `Retry-After` response.

Per-job status, attempts, failure reason, and completion time are recorded in
`ingestion_jobs`. Run counts and resumable discovery offsets are recorded in
`ingestion_runs` and `ingestion_discovery_state`. For Met, discovery state stores
the active curated search term and offset so runs can resume across country,
region, and culture queries. Existing artifact, source, image, variant, and
review tables remain the ingestion data model. Migration `0002_ingestion_jobs.sql`
adds job tracking and discovery state; `0004_met_discovery_cursor.sql` adds the
Met search cursor.

## Job payload

```json
{
  "id": "job_0123456789abcdef01234567",
  "runId": "00000000-0000-4000-8000-000000000000",
  "source": "met",
  "externalId": "12345"
}
```

`source` is `met` or `smithsonian`. Messages are validated before Workflow
creation. The source plus external ID is still checked against
`artifact_sources`; identical source hashes are skipped, while changed records
are upserted using the existing deterministic IDs.

## Provisioning and secrets

Wrangler config binds these named resources but does not create production
resources during this implementation:

- Queue: `culturio-ingest`
- DLQ: `culturio-ingest-dlq`
- Workflow: `culturio-ingestion` / `IngestionWorkflow`
- R2 bucket: `culturio-media`
- Existing D1 database: `culturio-db` (binding and ID preserved)
- Images binding: `IMAGES`

Create the Queue resources and R2 bucket in the same Cloudflare account as the
Worker. The deployment registers the Workflow binding/class from Wrangler
configuration.

```sh
pnpm --dir apps/web exec wrangler queues create culturio-ingest
pnpm --dir apps/web exec wrangler queues create culturio-ingest-dlq
pnpm --dir apps/web exec wrangler r2 bucket create culturio-media
```

Set the existing Smithsonian credential and the trigger bearer token as Worker
secrets. `INGESTION_TRIGGER_SECRET` must be a long random value; do not commit it.
Set a separate `INGESTION_AUTOPUBLISH_SECRET` for the completed-run publication
endpoint. Keep it only in the Worker and the GitHub Actions secret store.

```sh
pnpm --dir apps/web exec wrangler secret put SMITHSONIAN_API_KEY
pnpm --dir apps/web exec wrangler secret put INGESTION_TRIGGER_SECRET
pnpm --dir apps/web exec wrangler secret put INGESTION_AUTOPUBLISH_SECRET
```

Cloudflare Images must be enabled for the account. No Images account hash or
third-party image service is needed for the Worker binding API.

Apply the new D1 migration after deployment configuration is ready:

```sh
pnpm --dir apps/web exec wrangler d1 migrations apply DB --remote --config wrangler.jsonc
```

## Local development

Wrangler locally simulates configured D1, Queue, and Workflow bindings. The
current config does not enable `MEDIA` or `IMAGES`, so jobs that need those
bindings will not complete their image-storage steps locally. Cloudflare Images
is not locally simulated; it needs a remote binding connection for image
processing. Add local secret values to `apps/web/.dev.vars` (ignored by Git):

```dotenv
INGESTION_TRIGGER_SECRET=local-development-token
SMITHSONIAN_API_KEY=your-local-test-key
```

Run the adapter build and serve the wrapped Worker in workerd:

```sh
pnpm --filter @culturio/web dev:worker
```

Build, apply local D1 migrations, start Wrangler, and trigger a small Met batch
with one command:

```sh
pnpm --filter @culturio/web ingest:local -- --source met --limit 5
```

The command reads `INGESTION_TRIGGER_SECRET` from `apps/web/.dev.vars`, leaves
Wrangler running so local Queue and Workflow jobs can process, and stops when
you press Ctrl+C. The default source and limit are `met` and `5`. Supported
sources are `met`, `smithsonian`, and `all`; the limit is 1–20. Discovery makes
live museum API requests. For offline tests, use the adapter and
binding mocks in the ingestion test suite instead.

## Deployment and monitoring

Apply migrations, provision named Queue/R2 resources and secrets, then deploy
the same SvelteKit Worker as usual:

```sh
pnpm --filter @culturio/web deploy
```

`src/worker.ts` is the deployed entry point. The official adapter writes its
normal SvelteKit `fetch` Worker to `.svelte-kit/cloudflare/_worker.js` using
`wrangler.adapter.jsonc`; the source wrapper delegates HTTP requests to that
generated handler and exports the Queue handler and Workflow class. The
generated file is never edited or renamed by hand.

Use **Actions → Remote ingestion → Run workflow** to select MET or Smithsonian.
Each dispatch scans until it queues 20 qualifying jobs or reaches the end of the
selected museum's source results, waits until the D1 run is terminal, then asks the Worker to publish only
eligible artifacts from that run. Eligible means confirmed African origin and
at least one processed, redistributable image with variants. Publishing copies
variants from the private bucket to the public bucket, updates D1, and records
an automation audit event. Failed and ambiguous records remain unpublished.

Configure these GitHub repository secrets: `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`, `INGESTION_TRIGGER_SECRET`, and
`INGESTION_AUTOPUBLISH_SECRET`. The Cloudflare token needs D1 access for Wrangler
to poll the run. Add the repository variable `CULTURIO_WORKER_URL` with the
deployed Worker base URL. On a personal repository, only its owner passes the
workflow guard. For an organization-owned repository, also set
`INGESTION_OWNER_LOGINS` to a comma-separated list of organization owner
usernames; the workflow skips all other actors before exposing secrets.

The workflow uses `cloudflare/wrangler-action` to run Wrangler against remote
D1. It polls `ingestion_runs` by the run ID returned from discovery; Queue depth
alone is not sufficient because Workflows may still be processing after a
message leaves the Queue. GitHub serializes dispatches so two production batches
cannot overlap.

For a direct remote discovery trigger without waiting or automatic publication,
set `CULTURIO_WORKER_URL` and `INGESTION_TRIGGER_SECRET` in your shell and run
`pnpm ingest --source met --limit 5`. The command returns after jobs are queued.

Monitor Queue depth and DLQ messages in the Cloudflare dashboard or with:

```sh
pnpm --dir apps/web exec wrangler queues info culturio-ingest
pnpm --dir apps/web exec wrangler queues info culturio-ingest-dlq
pnpm --dir apps/web exec wrangler workflows instances list culturio-ingestion
```

Use the D1 `ingestion_jobs` and `ingestion_runs` tables for status, failures,
and batch progress. Workflow logs include job ID, run ID, source, step failure,
and terminal outcome. Retry invalid Queue messages by inspecting and correcting
the producer payload, then republishing; retry failed Workflow instances with
Wrangler's `workflows instances restart` command after addressing the cause.

## Source and business rules

Adapters implement discovery, record fetch, and source-specific normalization.
The Met adapter uses the paginated v1.1 search endpoint; Smithsonian uses its
authenticated Open Access search and content endpoints. Africa classification
uses explicit place, culture, civilization, and historical-region mappings. A
bare textual occurrence of “Africa” is ambiguous, not proof. Missing or
ambiguous media rights default to no redistribution and manual review.

To add a museum, implement `SourceAdapter`, validate the remote response before
normalization, preserve the complete source record, and add deterministic
fixtures. Never map a remote field based only on a similarly named field from
another museum.
