# Gallery performance baseline

Performance targets are LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms, and Lighthouse mobile ≥90 at p75. These are not yet claimed as achieved: the repository has no representative published D1 dataset or deployed asset domain in this environment.

The implementation establishes stable image aspect ratios, responsive WebP `srcset`, dominant-color backgrounds, two high-priority gallery images at most, SSR for the first 24 records, cursor pagination, and Intersection Observer prefetching. The masonry implementation preserves DOM order and performs no scroll listener work.

Before release, ingest and review 500–1,000 records, then capture Lighthouse mobile runs for `/`, `/gallery`, three appended gallery pages, an artifact page, and a search URL. Record median and p75 Web Vitals, DOM nodes, peak memory, long tasks, layout shifts, and scroll-frame behavior. Repeat with cache cold and warm. Introduce virtualization only if profiling shows DOM growth is the limiting factor.
