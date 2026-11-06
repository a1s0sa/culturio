/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace App {
    interface Platform {
      env: {
        DB: D1Database;
        MEDIA: R2Bucket;
        ASSET_BASE_URL?: string;
      };
      context: ExecutionContext;
      caches: CacheStorage;
    }
  }
  namespace App {
    interface PageState {
      modalSlug?: string;
      returnFocusId?: string;
    }
  }
}

export {};
