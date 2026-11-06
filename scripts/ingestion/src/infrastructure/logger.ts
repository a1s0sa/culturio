import pino from 'pino';
import type { Config } from '../config.js';

export function createLogger(config: Config) {
  return pino({
    level: config.LOG_LEVEL,
    redact: {
      paths: [
        '*.token',
        '*.apiKey',
        '*.secret',
        'config.CLOUDFLARE_API_TOKEN',
        'config.R2_SECRET_ACCESS_KEY'
      ],
      censor: '[REDACTED]'
    }
  });
}
export type Logger = ReturnType<typeof createLogger>;
