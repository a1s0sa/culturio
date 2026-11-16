import sveltekit from '../.svelte-kit/cloudflare/_worker.js';
import { consumeIngestionDlq, consumeIngestionQueue } from '../src/lib/server/ingestion/queue.js';
export { IngestionWorkflow } from '../src/lib/server/ingestion/workflow.js';

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    return sveltekit.fetch(request, env, ctx);
  },
  queue(batch: MessageBatch<unknown>, env: Cloudflare.Env) {
    if (batch.queue === 'culturio-ingest-dlq') {
      return consumeIngestionDlq(batch, env as never);
    }
    return consumeIngestionQueue(batch, env as never);
  }
};
