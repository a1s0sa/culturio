# Media processing

Production media processing runs in an ingestion Workflow in the Cloudflare
Worker. Only explicitly redistributable images are downloaded. The Worker
accepts HTTPS museum image hosts only, refuses redirects, checks the response
MIME type and byte limit, and validates decoded dimensions through the Cloudflare
Images binding. Originals are stored unchanged in R2; Cloudflare Images creates
WebP versions at 320, 640, and 1280 pixels. Image metadata and object keys are
persisted to D1. Object keys follow
`artifacts/{artifact-id}/{sha256}/original.{ext}` and `{width}.webp`.

The Workers runtime cannot use Sharp's native Node binary or the Node DNS/net
APIs used by the former ingestion CLI. The production Worker uses Cloudflare
Images for decode/resize/format conversion, the platform Fetch API for remote
downloads, and native R2 bindings. The Node CLI's Sharp/S3/D1 HTTP modules remain
isolated to local legacy utilities and are not imported by the deployed Worker.

The Worker limits images to 20 MiB and 80 megapixels. It does not currently
record dominant color or run EXIF rotation itself; Cloudflare Images handles
orientation during transformation. Each image failure is logged and does not
prevent the artifact metadata from being ingested.
