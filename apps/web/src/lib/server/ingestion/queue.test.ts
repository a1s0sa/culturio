import { describe, expect, it, vi } from 'vitest';
import { consumeIngestionQueue } from './queue.js';

const job = {
  id: 'job_0123456789abcdef01234567',
  runId: '00000000-0000-4000-8000-000000000000',
  source: 'met' as const,
  externalId: '42'
};

function message(body: unknown) {
  return { id: 'message-1', body, ack: vi.fn(), retry: vi.fn() };
}

function setup(
  create: ReturnType<typeof vi.fn>,
  get = vi.fn().mockRejectedValue(new Error('missing'))
) {
  const item = message(job);
  const env = {
    INGEST_WORKFLOW: { create, get },
    DB: { prepare: () => ({ bind: () => ({ run: vi.fn() }) }) }
  };
  return { item, env };
}

describe('ingestion Queue consumer', () => {
  it('starts a Workflow and acknowledges only after creation', async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    const { item, env } = setup(create);
    await consumeIngestionQueue(
      { queue: 'culturio-ingest', messages: [item] } as never,
      env as never
    );
    expect(create).toHaveBeenCalledWith({ id: job.id, params: job });
    expect(item.ack).toHaveBeenCalledOnce();
    expect(item.retry).not.toHaveBeenCalled();
  });

  it('acks duplicate deliveries when the deterministic Workflow already exists', async () => {
    const create = vi.fn().mockRejectedValue(new Error('duplicate id'));
    const get = vi.fn().mockResolvedValue({ id: job.id });
    const { item, env } = setup(create, get);
    await consumeIngestionQueue(
      { queue: 'culturio-ingest', messages: [item] } as never,
      env as never
    );
    expect(get).toHaveBeenCalledWith(job.id);
    expect(item.ack).toHaveBeenCalledOnce();
    expect(item.retry).not.toHaveBeenCalled();
  });

  it('retries invalid payloads and transient Workflow creation failures', async () => {
    const create = vi.fn().mockRejectedValue(new Error('temporarily unavailable'));
    const invalid = message({ ...job, id: 'bad' });
    const transient = message(job);
    const { env } = setup(create);
    await consumeIngestionQueue(
      { queue: 'culturio-ingest', messages: [invalid, transient] } as never,
      env as never
    );
    expect(invalid.retry).toHaveBeenCalledOnce();
    expect(transient.retry).toHaveBeenCalledOnce();
    expect(invalid.ack).not.toHaveBeenCalled();
    expect(transient.ack).not.toHaveBeenCalled();
  });
});
