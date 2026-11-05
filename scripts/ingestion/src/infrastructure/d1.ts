import { HttpError, retryAfterMilliseconds, withRetry } from './retry.js';

export interface D1Statement { sql: string; params?: (string | number | null)[]; }
interface D1Envelope<T> { success: boolean; result: { success: boolean; results: T[]; meta: { changes?: number; duration?: number } }[]; errors: { message: string }[]; }

export class D1HttpClient {
  readonly endpoint: string;
  constructor(accountId: string, databaseId: string, private readonly token: string, private readonly fetcher: typeof fetch = fetch) {
    this.endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}/query`;
  }
  async batch<T = Record<string, unknown>>(statements: D1Statement[], signal?: AbortSignal): Promise<D1Envelope<T>['result']> {
    if (!statements.length) return [];
    if (statements.length > 100) throw new Error('D1 batch is bounded to 100 statements');
    return withRetry(async () => {
      const response = await this.fetcher(this.endpoint, { method: 'POST', headers: { authorization: `Bearer ${this.token}`, 'content-type': 'application/json' }, body: JSON.stringify({ batch: statements }), signal });
      if (!response.ok) throw new HttpError(`D1 request failed (${response.status})`, response.status, retryAfterMilliseconds(response));
      const payload = await response.json() as D1Envelope<T>;
      if (!payload.success || payload.result.some((result) => !result.success)) throw new Error(payload.errors.map((error) => error.message).join('; ') || 'D1 query failed');
      return payload.result;
    }, 5, signal);
  }
  async query<T = Record<string, unknown>>(sql: string, params: D1Statement['params'] = [], signal?: AbortSignal): Promise<T[]> {
    return (await this.batch<T>([{ sql, params }], signal))[0]?.results ?? [];
  }
}
