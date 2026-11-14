# Local Ingestion Runbook

## Prerequisites

- Install workspace dependencies with `pnpm install`.
- Ensure `apps/web/.dev.vars` exists. Keep it out of Git.
- Add a local trigger secret to that file:

  ```dotenv
  INGESTION_TRIGGER_SECRET=local-development-token
  ```

- For Smithsonian ingestion, also set `SMITHSONIAN_API_KEY`. The `all` source
  requires this key too.

## Start a Run

From the repository root, start with a small batch:

```sh
pnpm --filter @culturio/web ingest:local -- --source met --limit 5
```

The command builds the Worker, applies local D1 migrations, starts Wrangler, and
triggers discovery using the secret in `apps/web/.dev.vars`. Supported sources
are `met`, `smithsonian`, and `all`; the limit must be from 1 to 20. Defaults
are `met` and `5`. Discovery calls live museum APIs.

Leave the terminal running so Wrangler can process local Queue and Workflow
jobs. Press **Ctrl+C** to stop. If port 8787 is already in use, choose another
port with `--port 8788`.

## Monitor Progress

The trigger prints a response containing the run ID and discovered count. In a
second terminal, list local Workflow instances:

```sh
pnpm --dir apps/web exec wrangler workflows instances list culturio-ingestion --local
```

Inspect recent runs in local D1:

```sh
pnpm --dir apps/web exec wrangler d1 execute DB --local --config wrangler.jsonc --command "SELECT id, source, status, discovered, processed, errors FROM ingestion_runs ORDER BY started_at DESC LIMIT 5;"
```

## Local Bindings

`wrangler.jsonc` declares `MEDIA` (R2) and `IMAGES` bindings. Wrangler simulates
them locally by default, so local ingestion does not use or modify the
dashboard bucket and does not require dashboard bindings to be deployed. Local
R2 data is separate from production. The offline Images implementation supports
only a subset of transformation options, so image processing can differ from
production or fail for unsupported options. Discovery still calls live museum
APIs. See Cloudflare's documentation for [local binding
support](https://developers.cloudflare.com/workers/local-development/bindings-per-env/),
[Images in local development](https://developers.cloudflare.com/images/optimization/binding/),
and [local Workflow development](https://developers.cloudflare.com/workflows/build/local-development/).

## Troubleshooting

- **Missing trigger secret:** Check that `INGESTION_TRIGGER_SECRET` is present
  in `apps/web/.dev.vars` and that the file is saved.
- **Port is busy:** Retry with `--port 8788` (or another free port).
- **No artifacts discovered:** The response still includes a run ID. Check its
  `discovered` count and the local run table; the discovery checkpoint and
  existing-record rules may leave nothing eligible in this batch.
- **Jobs fail during image processing:** Check the local Wrangler output for an
  unsupported Images transformation. The offline implementation has fewer
  features than production; deploy and run against the configured Cloudflare
  bindings to verify full-fidelity processing.
