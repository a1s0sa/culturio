import { z } from 'zod';
import { fileURLToPath } from 'node:url';

const optionalCredential = z.string().trim().min(1).optional();
const envSchema = z.object({
  CLOUDFLARE_ACCOUNT_ID: optionalCredential,
  CLOUDFLARE_API_TOKEN: optionalCredential,
  CLOUDFLARE_D1_DATABASE_ID: optionalCredential,
  R2_ACCOUNT_ID: optionalCredential,
  R2_ACCESS_KEY_ID: optionalCredential,
  R2_SECRET_ACCESS_KEY: optionalCredential,
  R2_BUCKET_NAME: optionalCredential,
  R2_PUBLIC_BUCKET_NAME: optionalCredential
});

export type Config = z.infer<typeof envSchema>;
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return envSchema.parse(env);
}
export function loadRootEnv(): void {
  try {
    process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
export function requireD1Credentials(config: Config): void {
  const missing = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_D1_DATABASE_ID'
  ].filter((key) => !config[key as keyof Config]);
  if (missing.length) throw new Error(`Missing required configuration: ${missing.join(', ')}`);
}
export function requireProductionCredentials(config: Config): void {
  const keys: (keyof Config)[] = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_D1_DATABASE_ID',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME'
  ];
  keys.push('R2_PUBLIC_BUCKET_NAME');
  const missing = keys.filter((key) => !config[key]);
  if (missing.length) throw new Error(`Missing required configuration: ${missing.join(', ')}`);
}
