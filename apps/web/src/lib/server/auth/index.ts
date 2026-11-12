import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { createDatabase } from '@culturio/db';
import * as schema from '@culturio/db/schema';
import { sendMagicLinkEmail } from './zeptomail';

type AuthEnv = Cloudflare.Env;

export function createAuth(env: AuthEnv) {
  return betterAuth({
    appName: 'Culturio',
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(createDatabase(env.DB), {
      provider: 'sqlite',
      schema
    }),
    emailAndPassword: { enabled: false },
    plugins: [
      magicLink({
        expiresIn: 300,
        sendMagicLink: ({ email, url }) => sendMagicLinkEmail(env, email, url)
      })
    ]
  });
}
