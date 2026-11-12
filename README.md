# Culturio

Culturio is an open-source platform for preserving and discovering historical African artifacts. It includes a performant SvelteKit digital gallery and an independent ingestion system. The 3D virtual museum remains a future phase.

## Workspace

- `apps/web` — SvelteKit application targeting Cloudflare Workers.
- `packages/db` — normalized Drizzle/D1 schema, migration, and FTS5 queries.
- `packages/shared` — validated contracts, historical dates, and geographic rules.
- `scripts/ingestion` — shared Met and Smithsonian adapters plus the legacy local CLI. Production discovery and ingestion run through the SvelteKit Worker, Queues, Workflows, D1, R2, and Cloudflare Images; see [docs/ingestion.md](docs/ingestion.md).

## Local setup

Requirements: Node.js 24, pnpm 12, and a copy of `.env.example` populated only with the services you intend to use.

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
pnpm test:e2e
```

Provision D1 and R2 before publishing data. Add `DB` and `MEDIA` bindings to `apps/web/wrangler.jsonc`, apply `packages/db/migrations`, and use least-privilege API tokens. See [operations](docs/operations.md).

```bash
pnpm ingest --source met --limit 20 --dry-run
pnpm ingest --source smithsonian --limit 100
pnpm db:rebuild-search
pnpm export
```

The gallery lives at `/gallery`, with canonical artifact pages at `/artifacts/[slug]`. It renders an intentional empty state until reviewed records and redistributable images are marked `published` in D1. See [gallery architecture](docs/gallery-architecture.md) and the unclaimed [performance baseline](docs/performance.md).

The software is MIT licensed. Imported metadata and media retain their source-specific rights; the software license does not grant rights to cultural heritage content.
