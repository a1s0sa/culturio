# Culturio

Culturio is an open-source platform for preserving and discovering historical African artifacts. It includes a SvelteKit digital gallery and a Cloudflare-based ingestion system. The 3D virtual museum remains a future phase.

## Workspace

- `apps/web` — SvelteKit application targeting Cloudflare Workers.
- `packages/db` — normalized Drizzle/D1 schema, migration, and FTS5 queries.
- `packages/shared` — validated contracts, museum adapters, retry handling, dates, and geographic rules.
- `scripts/ingestion` — remote Worker trigger and Cloudflare maintenance commands. Discovery and processing run through the SvelteKit Worker, Queues, Workflows, D1, R2, and Cloudflare Images; see [docs/ingestion.md](docs/ingestion.md).

## Local setup

Requirements: Node.js 24, pnpm 12, and a copy of `.env.example` populated only with the services you intend to use.

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm test:e2e
```

Provision D1, both R2 buckets, Queues, and the Workflow before ingestion. Add local Worker values to `apps/web/.dev.vars`; use GitHub secrets and variables for remote workflow dispatch. See [operations](docs/operations.md).

```bash
pnpm ingest --source met --limit 5
pnpm db:rebuild-search
pnpm export
```

`pnpm ingest` triggers the deployed Worker and exits after discovery queues
jobs. Remote workflow dispatch waits for processing and automatically publishes
only eligible results. See the [ingestion runbook](docs/local-ingestion-runbook.md).

The gallery lives at `/gallery`, with canonical artifact pages at `/artifacts/[slug]`. It renders an intentional empty state until reviewed records and redistributable images are marked `published` in D1. See [gallery architecture](docs/gallery-architecture.md) and the unclaimed [performance baseline](docs/performance.md).

The software is MIT licensed. Imported metadata and media retain their source-specific rights; the software license does not grant rights to cultural heritage content.
