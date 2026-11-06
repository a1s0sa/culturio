# Digital gallery architecture

The gallery server-renders 24 records and appends bounded cursor pages from `/api/artifacts`. A cursor includes the sort tuple and a signature of the active query and filters, preventing reuse after discovery state changes. FTS results use BM25 plus artifact ID; other sorts use deterministic secondary IDs.

## Masonry trade-off

The layout uses row-major CSS Grid with stored image ratios and one `ResizeObserver` to calculate row spans. This keeps DOM and keyboard order aligned with query order, unlike CSS columns, while avoiding a masonry dependency. It performs one batched calculation after resize or page append. CSS native masonry can replace this when support and accessibility behavior are sufficiently stable.

## Historical sorting

Oldest uses the lower date bound ascending; newest uses the upper bound descending. Unknown dates sort after known dates. Approximate dates remain marked uncertain and are never presented as exact. Artifact ID is the stable final tie-breaker.

## Navigation and caching

Desktop cards use SvelteKit shallow routing to display a dialog while retaining loaded pages and scroll position. Direct and mobile navigation renders the canonical artifact route. Public detail and gallery responses use short browser TTLs and longer edge TTLs with cache tags, allowing ingestion changes to become visible without redeployment.
