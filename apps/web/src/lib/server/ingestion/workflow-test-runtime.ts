export class WorkflowEntrypoint<Env, Params> {
  protected env: Env;
  constructor(_ctx: unknown, env: Env) {
    this.env = env;
  }
}

export class NonRetryableError extends Error {}
