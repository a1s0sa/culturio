import { createHash } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import { loadConfig, requireProductionCredentials } from './config.js';
import { D1HttpClient } from './infrastructure/d1.js';
import { createR2Client } from './infrastructure/r2.js';

async function main() {
  try {
    process.loadEnvFile('../../.env');
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code !== 'ENOENT') throw cause;
  }
  const apply = process.argv.includes('--apply');
  const config = loadConfig();
  requireProductionCredentials(config);
  if (!config.R2_PUBLIC_BUCKET_NAME)
    throw new Error('R2_PUBLIC_BUCKET_NAME must be set to culturio-media');

  const d1 = new D1HttpClient(
    config.CLOUDFLARE_ACCOUNT_ID!,
    config.CLOUDFLARE_D1_DATABASE_ID!,
    config.CLOUDFLARE_API_TOKEN!
  );
  const publicVariants = new Set(
    await d1
      .query<{ object_key: string }>(
        `SELECT DISTINCT v.object_key FROM image_variants v
       JOIN artifact_images i ON i.id=v.image_id
       JOIN artifacts a ON a.id=i.artifact_id
       WHERE a.publication_status='published' AND i.publication_status='published'
         AND i.redistribution_allowed=1 AND i.processed_at IS NOT NULL
         AND i.original_object_key IS NOT NULL`
      )
      .then((rows) => rows.map(({ object_key }) => object_key))
  );
  const client = createR2Client(config);
  let continuationToken: string | undefined;
  let publicCount = 0;
  let privateCount = 0;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: config.R2_PUBLIC_BUCKET_NAME,
        ContinuationToken: continuationToken
      })
    );
    for (const object of page.Contents ?? []) {
      const key = object.Key;
      if (!key) continue;
      if (publicVariants.has(key)) {
        publicCount += 1;
        continue;
      }
      privateCount += 1;
      if (!apply) continue;

      const source = await client.send(
        new GetObjectCommand({ Bucket: config.R2_PUBLIC_BUCKET_NAME, Key: key })
      );
      if (!source.Body) throw new Error(`R2 object has no body: ${key}`);
      const body = await source.Body.transformToByteArray();
      await client.send(
        new PutObjectCommand({
          Bucket: config.R2_BUCKET_NAME!,
          Key: key,
          Body: body,
          ContentType: source.ContentType,
          CacheControl: 'private, no-store',
          Metadata: source.Metadata
        })
      );
      const verified = await client.send(
        new HeadObjectCommand({ Bucket: config.R2_BUCKET_NAME!, Key: key })
      );
      if (verified.ContentLength !== body.byteLength)
        throw new Error(`Copied object failed size verification: ${key}`);
      const copied = await client.send(
        new GetObjectCommand({ Bucket: config.R2_BUCKET_NAME!, Key: key })
      );
      if (!copied.Body) throw new Error(`Copied object could not be read back: ${key}`);
      const copiedBytes = await copied.Body.transformToByteArray();
      const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
      if (digest(body) !== digest(copiedBytes))
        throw new Error(`Copied object failed checksum verification: ${key}`);
      await client.send(
        new DeleteObjectCommand({ Bucket: config.R2_PUBLIC_BUCKET_NAME, Key: key })
      );
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  console.info(
    JSON.stringify({
      mode: apply ? 'applied' : 'dry-run',
      mediaBucket: config.R2_PUBLIC_BUCKET_NAME,
      unpublishedBucket: config.R2_BUCKET_NAME,
      retainedPublishedVariants: publicCount,
      movedToPrivateBucket: privateCount
    })
  );
}

main().catch((cause) => {
  console.error(cause instanceof Error ? cause.message : String(cause));
  process.exitCode = 1;
});
