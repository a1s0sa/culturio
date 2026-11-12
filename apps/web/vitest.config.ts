import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'cloudflare:workers',
        replacement: fileURLToPath(
          new URL('./src/lib/server/ingestion/workflow-test-runtime.ts', import.meta.url)
        )
      },
      {
        find: 'cloudflare:workflows',
        replacement: fileURLToPath(
          new URL('./src/lib/server/ingestion/workflow-test-runtime.ts', import.meta.url)
        )
      }
    ]
  },
  test: { include: ['src/**/*.test.ts'], environment: 'node' }
});
