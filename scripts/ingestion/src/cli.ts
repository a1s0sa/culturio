#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { MetAdapter } from './adapters/met.js';
import { SmithsonianAdapter } from './adapters/smithsonian.js';
import { loadConfig, requireD1Credentials, requireProductionCredentials } from './config.js';
import { D1HttpClient } from './infrastructure/d1.js';
import { createLogger } from './infrastructure/logger.js';
import { createR2Client } from './infrastructure/r2.js';
import { runIngestion } from './pipeline/orchestrator.js';

const help = `Culturio ingestion

Usage:
  pnpm ingest --source <met|smithsonian|all> --limit <n> [--dry-run]
  pnpm ingest --resume <run-id> --source <source> --limit <n>
  pnpm ingest --retry-failed <run-id> --source <source> --limit <n>
  pnpm ingest:report
  pnpm db:rebuild-search
  pnpm export

Options:
  --source          Museum adapter (default: met)
  --limit           Successfully handled records, 1-1000 (default: 100)
  --dry-run         Validate and process without D1 or R2 writes
  --resume          Continue from a stored run checkpoint
  --retry-failed    Start a recovery pass associated with a prior run
  --help            Show this message
`;

async function main() {
  try { process.loadEnvFile('../../.env'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const command = process.argv[2] ?? 'ingest';
  const config = loadConfig(); const logger = createLogger(config);
  if (command === 'ingest') {
    const parsed = parseArgs({ args: process.argv.slice(3), options: { source:{type:'string',default:'met'},limit:{type:'string',default:'100'},'dry-run':{type:'boolean',default:false},resume:{type:'string'},'retry-failed':{type:'string'},help:{type:'boolean',short:'h'} }, strict:true });
    if (parsed.values.help) { process.stdout.write(help); return; }
    const source = parsed.values.source; if (!['met','smithsonian','all'].includes(source)) throw new Error('--source must be met, smithsonian, or all');
    const limit = Number(parsed.values.limit); if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error('--limit must be an integer from 1 through 1000');
    if ((source === 'smithsonian' || source === 'all') && !config.SMITHSONIAN_API_KEY) throw new Error('SMITHSONIAN_API_KEY is required for Smithsonian ingestion');
    if (!parsed.values['dry-run']) requireProductionCredentials(config, source === 'smithsonian' || source === 'all' ? 'smithsonian' : source);
    const d1 = config.CLOUDFLARE_ACCOUNT_ID && config.CLOUDFLARE_D1_DATABASE_ID && config.CLOUDFLARE_API_TOKEN ? new D1HttpClient(config.CLOUDFLARE_ACCOUNT_ID,config.CLOUDFLARE_D1_DATABASE_ID,config.CLOUDFLARE_API_TOKEN) : undefined;
    const adapters = [new MetAdapter(), ...(config.SMITHSONIAN_API_KEY ? [new SmithsonianAdapter(config.SMITHSONIAN_API_KEY)] : [])];
    const report = await runIngestion({ source:source as 'met'|'smithsonian'|'all',limit,dryRun:parsed.values['dry-run'],resumeRunId:parsed.values.resume,retryFailedRunId:parsed.values['retry-failed'] },{config,adapters,d1,r2:parsed.values['dry-run'] ? undefined : createR2Client(config),logger});
    process.stdout.write(`${JSON.stringify(report,null,2)}\n`); return;
  }
  if (command === 'report') { const files=(await readdir('reports')).filter((file)=>file.endsWith('.json')).sort(); const latest=files.at(-1); if(!latest) throw new Error('No local ingestion reports found'); process.stdout.write(await readFile(`reports/${latest}`,'utf8')); return; }
  requireD1Credentials(config);
  const d1 = new D1HttpClient(config.CLOUDFLARE_ACCOUNT_ID!,config.CLOUDFLARE_D1_DATABASE_ID!,config.CLOUDFLARE_API_TOKEN!);
  if (command === 'rebuild-search') { await d1.batch([{sql:"INSERT INTO artifacts_fts(artifacts_fts) VALUES('rebuild')"}]); logger.info('FTS5 search index rebuilt'); return; }
  if (command === 'export') { const rows=await d1.query(`SELECT a.id,a.slug,a.title,a.alternative_names,a.description,a.artifact_type,a.origin,a.historical_period,a.earliest_year,a.latest_year,a.date_display,a.materials,s.institution,s.source_url,s.attribution,s.metadata_license FROM artifacts a JOIN artifact_sources s ON s.artifact_id=a.id WHERE a.publication_status='published' AND NOT EXISTS (SELECT 1 FROM artifact_images i WHERE i.artifact_id=a.id AND i.redistribution_allowed=0)`); await mkdir('reports',{recursive:true}); await writeFile('reports/redistributable-artifacts.json',JSON.stringify({exportedAt:new Date().toISOString(),records:rows},null,2)); logger.info({count:rows.length},'export created'); return; }
  if (command === '--help' || command === 'help') { process.stdout.write(help); return; }
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode=1; });
