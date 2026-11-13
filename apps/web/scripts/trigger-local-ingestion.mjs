import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPort = 8787;

function argumentsFrom(argv) {
  const options = { source: 'met', limit: 5, port: defaultPort };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === '--help' || key === '-h') {
      console.log(
        'Usage: pnpm ingest:local [--source met|smithsonian|all] [--limit 1-20] [--port 8787]'
      );
      process.exit(0);
    }
    if (!['--source', '--limit', '--port'].includes(key)) {
      throw new Error(`Unknown option: ${key}`);
    }
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
  if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535) {
    throw new Error('--port must be a valid TCP port');
  }
  return options;
}

function readSecret(contents) {
  const match = contents.match(/^\s*INGESTION_TRIGGER_SECRET\s*=\s*(.*?)\s*$/m);
  let value = match?.[1]?.trim();
  if (!value) throw new Error('INGESTION_TRIGGER_SECRET is missing from apps/web/.dev.vars');
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  } else {
    value = value.replace(/\s+#.*$/, '').trim();
  }
  if (!value) throw new Error('INGESTION_TRIGGER_SECRET is empty in apps/web/.dev.vars');
  return value;
}

async function assertPortAvailable(port) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () => reject(new Error(`Port ${port} is already in use`)));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}

async function waitForWorker(url, child, getExit) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const exit = getExit();
    if (exit) throw new Error(`Wrangler exited before becoming ready (${exit})`);
    try {
      await fetch(`${url}/api/ingestion/discover`, { signal: AbortSignal.timeout(1500) });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw new Error('Timed out waiting for Wrangler dev to start');
}

async function main() {
  const options = argumentsFrom(process.argv.slice(2));
  const vars = await readFile(path.join(appDirectory, '.dev.vars'), 'utf8');
  const secret = readSecret(vars);
  await assertPortAvailable(options.port);

  const worker = spawn(
    'pnpm',
    ['exec', 'wrangler', 'dev', '--config', 'wrangler.jsonc', '--port', String(options.port)],
    { cwd: appDirectory, stdio: 'inherit' }
  );
  let exitInfo;
  let spawnError;
  worker.on('exit', (code, signal) => {
    exitInfo = signal ? `signal ${signal}` : `code ${code}`;
    if (triggered && code !== 0) process.exitCode = code ?? 1;
  });
  worker.on('error', (error) => {
    spawnError = error;
  });

  let triggered = false;
  try {
    const url = `http://127.0.0.1:${options.port}`;
    await waitForWorker(url, worker, () => spawnError?.message ?? exitInfo);
    console.log(
      `Triggering ${options.source} discovery (limit ${options.limit}). Museum APIs are live.`
    );
    const response = await fetch(`${url}/api/ingestion/discover`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${secret}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ source: options.source, limit: options.limit })
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`Discovery returned ${response.status}: ${body}`);
    console.log(`Discovery accepted: ${body}`);
    console.log(
      'Wrangler remains running to process local Queue and Workflow jobs. Press Ctrl+C to stop.'
    );
    triggered = true;
    if (!exitInfo) await new Promise((resolve) => worker.once('exit', resolve));
  } finally {
    if (!triggered && !exitInfo) {
      worker.kill('SIGTERM');
      await new Promise((resolve) => worker.once('exit', resolve));
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
