import { z } from 'zod';

const optionalCredential = z.string().trim().min(1).optional();
const envSchema = z.object({
  CLOUDFLARE_ACCOUNT_ID: optionalCredential,
  CLOUDFLARE_API_TOKEN: optionalCredential,
  CLOUDFLARE_D1_DATABASE_ID: optionalCredential,
  R2_ACCOUNT_ID: optionalCredential,
  R2_ACCESS_KEY_ID: optionalCredential,
  R2_SECRET_ACCESS_KEY: optionalCredential,
  R2_BUCKET_NAME: optionalCredential,
  R2_PUBLIC_BASE_URL: z.url().default('https://assets.culturio.africa'),
  SMITHSONIAN_API_KEY: optionalCredential,
  API_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(4),
  DOWNLOAD_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(3),
  PROCESS_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
  UPLOAD_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(3),
  D1_CONCURRENCY: z.coerce.number().int().min(1).max(5).default(2),
  IMAGE_MAX_BYTES: z.coerce
    .number()
    .int()
    .min(1024)
    .default(30 * 1024 * 1024),
  IMAGE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(20_000),
  IMAGE_WEBP_QUALITY: z.coerce.number().int().min(1).max(100).default(82),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info')
});

export type Config = z.infer<typeof envSchema>;
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return envSchema.parse(env);
}
export function requireD1Credentials(config: Config): void {
  const missing = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_D1_DATABASE_ID'
  ].filter((key) => !config[key as keyof Config]);
  if (missing.length) throw new Error(`Missing required configuration: ${missing.join(', ')}`);
}
export function requireProductionCredentials(config: Config, source?: string): void {
  const keys: (keyof Config)[] = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_D1_DATABASE_ID',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME'
  ];
  if (source === 'smithsonian') keys.push('SMITHSONIAN_API_KEY');
  const missing = keys.filter((key) => !config[key]);
  if (missing.length) throw new Error(`Missing required configuration: ${missing.join(', ')}`);
}
