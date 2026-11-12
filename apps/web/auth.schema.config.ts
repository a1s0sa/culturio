import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';

// This static config lets `auth generate` include the magic-link schema without a Worker binding.
export const auth = betterAuth({
  secret: 'schema-generation-only-secret-keep-out-of-runtime',
  plugins: [magicLink({ sendMagicLink: async () => {} })]
});
