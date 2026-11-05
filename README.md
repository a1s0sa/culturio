# Culturio

Culturio is an open-source foundation for preserving and discovering historical African artifacts. This phase contains a minimal SvelteKit application and an independent ingestion system; the gallery and virtual museum are intentionally not implemented yet.

## Workspace

- `apps/web` — SvelteKit application targeting Cloudflare Workers.
- `packages/db` — normalized Drizzle/D1 schema, migration, and FTS5 queries.
- `packages/shared` — validated contracts, historical dates, and geographic rules.
- `scripts/ingestion` — Node.js museum adapters, Sharp media pipeline, D1/R2 clients, and CLI.

## Local setup

Requirements: Node.js 24, pnpm 12, and a copy of `.env.example` populated only with the services you intend to use.

```bash
pnpm install
pnpm dev
pnpm check
pnpm test
```

Provision D1 and R2 before publishing data. Add `DB` and `MEDIA` bindings to `apps/web/wrangler.jsonc`, apply `packages/db/migrations`, and use least-privilege API tokens. See [operations](docs/operations.md).

```bash
pnpm ingest --source met --limit 20 --dry-run
pnpm ingest --source smithsonian --limit 100
pnpm db:rebuild-search
pnpm export
```

The software is MIT licensed. Imported metadata and media retain their source-specific rights; the software license does not grant rights to cultural heritage content.
