import { appendFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const workerUrl = process.env.CULTURIO_WORKER_URL;
const triggerSecret = process.env.INGESTION_TRIGGER_SECRET;
const publishSecret = process.env.INGESTION_AUTOPUBLISH_SECRET;
const source = process.env.INGESTION_SOURCE;
const target = Number(process.env.INGESTION_LIMIT);
const discoveryChunkSize = 20;
const pollIntervalMs = 15_000;
const timeoutMs = 3.5 * 60 * 60 * 1000;
const requestTimeoutMs = 10 * 60 * 1000;

if (!workerUrl || !triggerSecret || !publishSecret) {
  throw new Error(
    'CULTURIO_WORKER_URL, INGESTION_TRIGGER_SECRET, and INGESTION_AUTOPUBLISH_SECRET are required.'
  );
}
if (!['met', 'smithsonian'].includes(source ?? '')) {
  throw new Error('INGESTION_SOURCE must be met or smithsonian.');
}
if (!Number.isInteger(target) || target < 10 || target > 100) {
  throw new Error('INGESTION_LIMIT must be an integer from 10 to 100.');
}

const baseUrl = new URL(workerUrl);
if (baseUrl.protocol !== 'https:') throw new Error('CULTURIO_WORKER_URL must use HTTPS.');

async function post(path, secret, body) {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(requestTimeoutMs)
  });
  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`${path} returned non-JSON (${response.status}): ${text}`);
  }
  if (!response.ok)
    throw new Error(`${path} returned ${response.status}: ${JSON.stringify(result)}`);
  return result;
}

function queryD1(sql) {
  const output = execFileSync(
    'pnpm',
    [
      'exec',
      'wrangler',
      'd1',
      'execute',
      'DB',
      '--remote',
      '--json',
      '--config',
      'wrangler.jsonc',
      '--command',
      sql
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
  );
  const parsed = JSON.parse(output);
  if (!parsed[0]?.success) throw new Error('Wrangler D1 query failed.');
  return parsed[0].results;
}

const runIds = [];
const discoveryRuns = [];
let discoveredTotal = 0;
let scannedTotal = 0;
let rejectedTotal = 0;
let sourceExhausted = false;
while (discoveredTotal < target && !sourceExhausted) {
  const limit = Math.min(discoveryChunkSize, target - discoveredTotal);
  const discovery = await post('/api/ingestion/discover', triggerSecret, { source, limit });
  const runs = discovery.runs;
  if (!Array.isArray(runs) || runs.length !== 1 || !runs[0]?.runId) {
    throw new Error(`Discovery returned an unexpected response: ${JSON.stringify(discovery)}`);
  }
  const run = runs[0];
  if (!/^[0-9a-f-]{36}$/i.test(run.runId)) throw new Error('Discovery returned an invalid run ID.');
  if (typeof run.exhausted !== 'boolean') {
    throw new Error(
      'The Worker response does not include source exhaustion state. Deploy the updated Worker before running this workflow.'
    );
  }
  for (const field of ['discovered', 'scanned', 'rejected']) {
    if (!Number.isInteger(run[field]) || run[field] < 0) {
      throw new Error(`Discovery returned an invalid ${field} count: ${JSON.stringify(run)}`);
    }
  }
  discoveryRuns.push(run);
  if (run.discovered > 0) runIds.push(run.runId);
  discoveredTotal += run.discovered;
  scannedTotal += run.scanned;
  rejectedTotal += run.rejected;
  sourceExhausted = run.exhausted;
  console.log(
    `Discovery chunk ${discoveryRuns.length}: queued ${run.discovered}, scanned ${run.scanned}, rejected ${run.rejected}; total ${discoveredTotal}/${target}. Checkpoint ${JSON.stringify(run.checkpoint)}${sourceExhausted ? ' (source exhausted)' : ''}.`
  );
  if (run.scanned === 0 && run.discovered === 0 && !sourceExhausted) {
    throw new Error('Discovery made no progress and did not report source exhaustion.');
  }
}

console.log(
  `Discovery finished: ${discoveredTotal}/${target} ${source} jobs from ${scannedTotal} scanned records (${rejectedTotal} rejected) across ${discoveryRuns.length} chunks.`
);

const startedAt = Date.now();
let latestRuns = [];
if (runIds.length) {
  while (Date.now() - startedAt < timeoutMs) {
    latestRuns = [];
    for (let index = 0; index < runIds.length; index += 20) {
      const batch = runIds.slice(index, index + 20);
      const idList = batch.map((id) => `'${id}'`).join(',');
      const results = queryD1(
        `SELECT id,status,discovered,processed,errors FROM ingestion_runs WHERE id IN (${idList})`
      );
      if (results.length !== batch.length) throw new Error('An ingestion run disappeared from D1.');
      latestRuns.push(...results);
    }

    for (const run of latestRuns) {
      console.log(
        `Run ${run.id}: ${run.status}, ${run.processed}/${run.discovered} processed, ${run.errors} failed.`
      );
    }
    if (latestRuns.every((run) => run.status !== 'running')) break;
    await delay(pollIntervalMs);
  }

  if (!latestRuns.every((run) => run.status !== 'running')) {
    throw new Error(`Timed out waiting for ingestion runs ${runIds.join(', ')}.`);
  }
}

const publications = [];
for (const runId of runIds) {
  publications.push(await post('/api/ingestion/publish', publishSecret, { runIds: [runId] }));
}
const published = publications.flatMap((result) => result.published);
const failed = publications.flatMap((result) => result.failed);
console.log(
  `Automated publication finished: ${published.length} published, ${failed.length} failed.`
);
for (const failure of failed) {
  console.error(`Could not publish ${failure.artifactId}: ${failure.reason}`);
}

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  const rows = latestRuns
    .map(
      (run) =>
        `| ${run.id} | ${run.status} | ${run.discovered} | ${run.processed} | ${run.errors} |`
    )
    .join('\n');
  await appendFile(
    summaryPath,
    `## Remote ${source} ingestion\n\nRequested ${target} eligible items; discovered ${discoveredTotal} from ${scannedTotal} scanned records and ${rejectedTotal} rejected records. ${sourceExhausted ? 'The source search was exhausted before reaching the requested count.' : ''}\n\n| Run | Status | Discovered | Processed | Failed |\n| --- | --- | ---: | ---: | ---: |\n${rows || '| No jobs queued | — | 0 | 0 | 0 |'}\n\nAutomatically published ${published.length} eligible artifacts.\n`
  );
}

if (latestRuns.some((run) => run.status === 'failed') || failed.length) {
  throw new Error('Remote ingestion or automatic publication finished with failures.');
}
