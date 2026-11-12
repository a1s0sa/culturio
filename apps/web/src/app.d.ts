/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database;
      MEDIA: R2Bucket;
      IMAGES: ImagesBinding;
      INGEST_QUEUE: Queue<unknown>;
      INGEST_DLQ: Queue<unknown>;
      INGEST_WORKFLOW: Workflow<unknown>;
      INGESTION_TRIGGER_SECRET?: string;
      SMITHSONIAN_API_KEY?: string;
      ASSET_BASE_URL?: string;
      BETTER_AUTH_SECRET: string;
      BETTER_AUTH_URL: string;
      ZEPTO_MAIL_API_KEY: string;
      ZEPTO_MAIL_API_URL: string;
      ZEPTO_MAIL_FROM_EMAIL: string;
      ZEPTO_MAIL_FROM_NAME: string;
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
