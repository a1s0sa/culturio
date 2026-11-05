# Repository Guidelines

## Project Structure & Module Organization

Culturio is a pnpm workspace targeting Node.js 24 and Cloudflare:

- `apps/web/`: full-stack SvelteKit application. Routes live in `src/routes`, reusable code in `src/lib`, and static assets in `static`.
- `packages/db/`: Drizzle schema, D1 clients and queries, SQL migrations, and migration validation.
- `packages/shared/`: Zod schemas, shared types, constants, and utilities used across workspaces.
- `scripts/ingestion/`: independent Node.js ingestion CLI, museum adapters, media processing, and infrastructure clients.
- `docs/`: architecture, data model, licensing, ingestion, media, and operations guidance.
- `.github/workflows/`: CI and manually triggered ingestion automation.

Keep dependencies in the workspace that uses them. Do not add a separate backend service or build gallery/museum interfaces unless the relevant phase explicitly requests them.

## Build, Test, and Development Commands

Run commands from the repository root:

- `pnpm install`: install all workspace dependencies.
- `pnpm dev`: start the SvelteKit application.
- `pnpm build`: build every workspace that defines a build script.
- `pnpm check`: run TypeScript and Svelte checks.
- `pnpm test`: run all Vitest suites.
- `pnpm lint` / `pnpm format:check`: validate formatting.
- `pnpm db:validate`: execute the migration and verify FTS synchronization in memory.
- `pnpm ingest --source met --limit 20 --dry-run`: validate a small ingestion without D1 or R2 writes.

## Coding Style & Naming Conventions

Use strict TypeScript and ESM. Prettier enforces single quotes, no trailing commas, and a 100-character line width. Use `camelCase` for variables/functions, `PascalCase` for types and Svelte components, and descriptive lowercase filenames such as `deduplicate.ts`. Keep modules cohesive and validate external data with Zod.

## Testing Guidelines

Tests use Vitest and belong in `tests/` or alongside source as `*.test.ts`. Mock museum APIs, D1, and R2; ordinary tests must never make live external requests. Cover normalization, licensing decisions, idempotency, failure recovery, image constraints, and FTS behavior when changing those areas.

## Commit & Pull Request Guidelines

No root Git history currently establishes a convention. Use Conventional Commits in the form `type(scope): imperative summary`, for example `feat(ingestion): add Met pagination checkpoints`.

Use these types consistently:

- `feat`: new user-facing or system capability.
- `fix`: bug or correctness repair.
- `chore`: maintenance, dependency, or tooling work.
- `docs`: documentation-only changes.
- `test`: new or corrected tests.
- `refactor`: internal restructuring without behavior changes.
- `perf`: measurable performance improvement.
- `ci`: workflow or automation changes.
- `build`: package, compiler, or build-system changes.
- `style`: formatting-only changes with no logic impact.

Use scopes such as `web`, `db`, `shared`, `ingestion`, or `media` when helpful. Add `!` and a `BREAKING CHANGE:` footer for incompatible changes. Keep each commit focused; avoid mixing refactors with features or generated migrations with unrelated edits.

Pull requests should explain scope, link issues, list verification commands, and identify migration or configuration changes. Include screenshots only for visible Svelte UI changes.

## Security & Configuration

Copy `.env.example` locally and never commit credentials. Keep Cloudflare and Smithsonian secrets server-side. Missing or ambiguous media rights must default to no redistribution and manual review.
