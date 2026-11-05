# Media processing

Only explicitly redistributable images enter the media pipeline. Downloads require HTTPS, reject credentials and private/reserved destinations, revalidate every redirect, enforce timeout and byte limits, and require an allowed declared MIME type. Sharp then validates the decoded format and pixel count.

EXIF orientation is applied before measuring or resizing. The original is preserved in its real format; public 320, 640, and 1280-pixel WebP variants use `withoutEnlargement`, preserve aspect ratio, strip source metadata, and avoid sharpening. Dominant color, dimensions, byte sizes, and compression totals are persisted or reported.

Keys follow `artifacts/{artifact-id}/{sha256}/original.{ext}` and `{width}.webp`. The content hash makes retries and duplicate media detectable. Processing and uploads are separately bounded so a runner never holds hundreds of originals in memory.
