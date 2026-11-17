import { appendFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const workerUrl = process.env.CULTURIO_WORKER_URL;
const triggerSecret = process.env.INGESTION_TRIGGER_SECRET;
const publishSecret = process.env.INGESTION_AUTOPUBLISH_SECRET;
const source = process.env.INGESTION_SOURCE;
const limit = 20;
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

const discovery = await post('/api/ingestion/discover', triggerSecret, { source, limit });
const runs = discovery.runs;
if (!Array.isArray(runs) || runs.length !== 1 || !runs[0]?.runId) {
  throw new Error(`Discovery returned an unexpected response: ${JSON.stringify(discovery)}`);
}
const runIds = runs.map((run) => run.runId);
if (!runIds.every((id) => /^[0-9a-f-]{36}$/i.test(id))) {
  throw new Error('Discovery returned an invalid run ID.');
}
console.log(
  `Discovery queued ${runs[0].discovered} ${source} jobs from ${runs[0].scanned} scanned records. Run ${runIds[0]}.`
);

const startedAt = Date.now();
let latestRuns;
while (Date.now() - startedAt < timeoutMs) {
  const idList = runIds.map((id) => `'${id}'`).join(',');
  latestRuns = queryD1(
    `SELECT id,status,discovered,processed,errors FROM ingestion_runs WHERE id IN (${idList})`
  );
  if (latestRuns.length !== runIds.length) throw new Error('An ingestion run disappeared from D1.');

  for (const run of latestRuns) {
    console.log(
      `Run ${run.id}: ${run.status}, ${run.processed}/${run.discovered} processed, ${run.errors} failed.`
    );
  }
  if (latestRuns.every((run) => run.status !== 'running')) break;
  await delay(pollIntervalMs);
}

if (!latestRuns?.every((run) => run.status !== 'running')) {
  throw new Error(`Timed out waiting for ingestion run ${runIds.join(', ')}.`);
}

const publication = await post('/api/ingestion/publish', publishSecret, { runIds });
console.log(
  `Automated publication finished: ${publication.published.length} published, ${publication.failed.length} failed.`
);
for (const failure of publication.failed) {
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
    `## Remote ${source} ingestion\n\n| Run | Status | Discovered | Processed | Failed |\n| --- | --- | ---: | ---: | ---: |\n${rows}\n\nAutomatically published ${publication.published.length} eligible artifacts.\n`
  );
}

if (latestRuns.some((run) => run.status === 'failed') || publication.failed.length) {
  throw new Error('Remote ingestion or automatic publication finished with failures.');
}
