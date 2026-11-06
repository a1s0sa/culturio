export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs?: number
  ) {
    super(message);
  }
}
export async function withRetry<T>(
  operation: () => Promise<T>,
  attempts = 4,
  signal?: AbortSignal
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    signal?.throwIfAborted();
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof HttpError
          ? error.status === 429 || error.status >= 500
          : error instanceof TypeError;
      if (!retryable || attempt === attempts - 1) throw error;
      const retryAfter = error instanceof HttpError ? error.retryAfterMs : undefined;
      const delay = retryAfter ?? Math.min(500 * 2 ** attempt + Math.random() * 250, 10_000);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(signal.reason);
          },
          { once: true }
        );
      });
    }
  }
  throw lastError;
}

export function retryAfterMilliseconds(response: Response): number | undefined {
  const value = response.headers.get('retry-after');
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}
