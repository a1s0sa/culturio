#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { sourceNameSchema } from '@culturio/shared';
import { loadConfig, loadRootEnv, requireD1Credentials } from './config.js';
import { D1HttpClient } from './infrastructure/d1.js';

const help = `Culturio ingestion

Usage:
  pnpm ingest --source <met|smithsonian|all> --limit <n>
  pnpm db:rebuild-search
  pnpm export

Remote ingestion is handled by the deployed Cloudflare Worker. Set
CULTURIO_WORKER_URL and INGESTION_TRIGGER_SECRET in the environment.

Options:
  --source   Museum adapter (default: met)
  --limit    Maximum discovered jobs per source, 1-20 (default: 5)
  --help     Show this message
`;

async function main() {
  loadRootEnv();
  const command = process.argv[2] ?? 'ingest';
  if (command === 'ingest') {
    await ingest();
    return;
  }

  const config = loadConfig();
  requireD1Credentials(config);
  const d1 = new D1HttpClient(
    config.CLOUDFLARE_ACCOUNT_ID!,
    config.CLOUDFLARE_D1_DATABASE_ID!,
    config.CLOUDFLARE_API_TOKEN!
  );
  if (command === 'rebuild-search') {
    await d1.batch([{ sql: "INSERT INTO artifacts_fts(artifacts_fts) VALUES('rebuild')" }]);
    console.info('FTS5 search index rebuilt.');
    return;
  }
  if (command === 'export') {
    const rows = await d1.query(
      `SELECT a.id,a.slug,a.title,a.alternative_names,a.description,a.artifact_type,a.origin,a.historical_period,a.earliest_year,a.latest_year,a.date_display,a.materials,s.institution,s.source_url,s.attribution,s.metadata_license FROM artifacts a JOIN artifact_sources s ON s.artifact_id=a.id WHERE a.publication_status='published' AND NOT EXISTS (SELECT 1 FROM artifact_images i WHERE i.artifact_id=a.id AND i.redistribution_allowed=0)`
    );
    const { mkdir, writeFile } = await import('node:fs/promises');
    await mkdir('scripts/ingestion/reports', { recursive: true });
    await writeFile(
      'scripts/ingestion/reports/redistributable-artifacts.json',
      JSON.stringify({ exportedAt: new Date().toISOString(), records: rows }, null, 2)
    );
    console.info(`Exported ${rows.length} redistributable artifacts.`);
    return;
  }
  if (command === '--help' || command === 'help') {
    process.stdout.write(help);
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

async function ingest() {
  const parsed = parseArgs({
    args: process.argv.slice(3),
    options: {
      source: { type: 'string', default: 'met' },
      limit: { type: 'string', default: '5' },
      help: { type: 'boolean', short: 'h' }
    },
    strict: true
  });
  if (parsed.values.help) {
    process.stdout.write(help);
    return;
  }
  const source = parsed.values.source;
  if (source !== 'all' && !sourceNameSchema.safeParse(source).success)
    throw new Error('--source must be met, smithsonian, or all');
  const limit = Number(parsed.values.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20)
    throw new Error('--limit must be an integer from 1 through 20');
  const workerUrl = process.env.CULTURIO_WORKER_URL;
  const secret = process.env.INGESTION_TRIGGER_SECRET;
  if (!workerUrl || !secret)
    throw new Error('CULTURIO_WORKER_URL and INGESTION_TRIGGER_SECRET are required.');

  const baseUrl = new URL(workerUrl);
  if (baseUrl.protocol !== 'https:' && baseUrl.hostname !== 'localhost')
    throw new Error('CULTURIO_WORKER_URL must use HTTPS (localhost is allowed for development).');
  const response = await fetch(new URL('/api/ingestion/discover', baseUrl), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ source, limit }),
    signal: AbortSignal.timeout(90_000)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Discovery returned ${response.status}: ${text}`);
  const result = JSON.parse(text) as {
    runs?: { runId: string; source: string; discovered: number; scanned: number }[];
  };
  if (!Array.isArray(result.runs)) throw new Error('Discovery response did not include runs.');
  for (const run of result.runs) {
    console.info(
      `Remote ${run.source} discovery queued ${run.discovered} jobs from ${run.scanned} scanned records. Run ${run.runId}.`
    );
  }
  console.info('Cloudflare Queue and Workflow processing continues after this command exits.');
}

main().catch((cause) => {
  console.error(cause instanceof Error ? cause.message : String(cause));
  process.exitCode = 1;
});
