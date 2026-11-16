import { fileURLToPath } from 'node:url';

function argumentsFrom(argv) {
  const options = { source: 'met', limit: 5 };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === '--help' || key === '-h') {
      console.log('Usage: pnpm ingest:remote [--source met|smithsonian|all] [--limit 1-20]');
      process.exit(0);
    }
    if (!['--source', '--limit'].includes(key)) throw new Error(`Unknown option: ${key}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    options[key.slice(2)] = key === '--source' ? value : Number(value);
    index += 1;
  }

  if (!['met', 'smithsonian', 'all'].includes(options.source)) {
    throw new Error('--source must be met, smithsonian, or all');
  }
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 20) {
    throw new Error('--limit must be an integer between 1 and 20');
  }
  return options;
}

async function main() {
  try {
    process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const options = argumentsFrom(process.argv.slice(2));
  const workerUrl = process.env.CULTURIO_WORKER_URL;
  const secret = process.env.INGESTION_TRIGGER_SECRET;
  if (!workerUrl) throw new Error('Set CULTURIO_WORKER_URL to the deployed Worker base URL');
  if (!secret) throw new Error('Set INGESTION_TRIGGER_SECRET in your environment');

  let endpoint;
  try {
    const baseUrl = new URL(workerUrl);
    if (baseUrl.protocol !== 'https:') throw new Error('The Worker URL must use HTTPS');
    endpoint = new URL('/api/ingestion/discover', baseUrl);
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message === 'The Worker URL must use HTTPS'
        ? error.message
        : 'CULTURIO_WORKER_URL must be a valid HTTPS URL'
    );
  }

  console.log(
    `Triggering remote ${options.source} discovery (limit ${options.limit}). Museum APIs are live.`
  );
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ source: options.source, limit: options.limit }),
    signal: AbortSignal.timeout(15_000)
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Discovery returned ${response.status}: ${body}`);
  console.log(`Remote discovery accepted: ${body}`);
  console.log('Queue and Workflow processing continues in Cloudflare after this command exits.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
