/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace App {
    interface Platform {
      env: {
        DB: D1Database;
        MEDIA: R2Bucket;
      };
      context: ExecutionContext;
      caches: CacheStorage;
    }
  }
}

export {};
