<script lang="ts">
  import MasonryGrid from '$lib/components/gallery/MasonryGrid.svelte';
  import SocialMeta from '$lib/components/seo/SocialMeta.svelte';
  import { revealOnScroll } from '$lib/actions/reveal-on-scroll';
  import { serializeJsonLd } from '$lib/seo/json-ld';
  let { data } = $props();
  let featuredTrack = $state<HTMLDivElement>();
  let featuredIndex = $state(0);
  let jsonLd = $derived(
    serializeJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://culturio.africa/#organization',
          name: 'Culturio',
          url: 'https://culturio.africa/',
          description:
            'An open archive for discovering African cultural heritage through its artifacts.'
        },
        {
          '@type': 'WebSite',
          '@id': 'https://culturio.africa/#website',
          name: 'Culturio',
          url: 'https://culturio.africa/',
          publisher: { '@id': 'https://culturio.africa/#organization' },
          inLanguage: 'en'
        }
      ]
    })
  );
  function moveFeatured(direction: -1 | 1) {
    if (!featuredTrack) return;
    const firstCard = featuredTrack.querySelector<HTMLElement>('.feature-card');
    if (!firstCard) return;
    const gap = Number.parseFloat(getComputedStyle(featuredTrack).columnGap) || 0;
    featuredTrack.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + gap),
      behavior: 'smooth'
    });
  }

  function updateFeaturedIndex() {
    if (!featuredTrack) return;
    const firstCard = featuredTrack.querySelector<HTMLElement>('.feature-card');
    if (!firstCard) return;
    const gap = Number.parseFloat(getComputedStyle(featuredTrack).columnGap) || 0;
    featuredIndex = Math.round(featuredTrack.scrollLeft / (firstCard.offsetWidth + gap));
  }
</script>

<svelte:head>
  <title>Culturio — Africa's history through its artifacts</title>
  <meta
    name="description"
    content="Discover historical objects, craftsmanship, and cultural heritage from civilizations across Africa."
  />
  <link rel="canonical" href="https://culturio.africa/" />
  {@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>
<SocialMeta
  title="Culturio — Africa's history through its artifacts"
  description="Discover historical objects, craftsmanship, and cultural heritage from civilizations across Africa."
  url="https://culturio.africa/"
  image="https://culturio.africa/opengraph/culturio-home.jpg"
  imageAlt="Culturio's open archive of African artifacts"
/>
<main>
  <section class="hero page-shell">
    <div>
      <p class="eyebrow">An open cultural archive</p>
      <h1 class="editorial-title">Discover Africa's history through its artifacts.</h1>
    </div>
    <div class="support">
      <p>
        Explore historical objects, craftsmanship, and cultural heritage from civilizations across
        the African continent.
      </p>
      <div>
        <a class="primary" href="/gallery">Explore the archive</a><a href="/museum"
          >Visit the virtual museum</a
        >
      </div>
    </div>
  </section>
  {#if data.featured.length}
    <section class="featured page-shell" aria-labelledby="featured-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">From the archive</p>
          <h2 id="featured-heading" class="editorial-title">Featured artifacts</h2>
        </div>
        <div class="carousel-controls" aria-label="Featured artifact controls">
          <span class="carousel-count" aria-live="polite">
            {String(featuredIndex + 1).padStart(2, '0')} / {String(data.featured.length).padStart(
              2,
              '0'
            )}
          </span>
          <button
            type="button"
            aria-label="Show previous featured artifact"
            disabled={featuredIndex === 0}
            onclick={() => moveFeatured(-1)}>←</button
          >
          <button
            type="button"
            aria-label="Show next featured artifact"
            disabled={featuredIndex >= data.featured.length - 1}
            onclick={() => moveFeatured(1)}>→</button
          >
        </div>
      </div>
      <div
        bind:this={featuredTrack}
        class="feature-viewport"
        role="region"
        aria-label="Featured artifacts carousel"
        onscroll={updateFeaturedIndex}
      >
        <ul class="feature-track">
          {#each data.featured as artifact, index (artifact.id)}
            <li class="feature-card" use:revealOnScroll={index % 4}>
              <a href={`/artifacts/${artifact.slug}`}>
                <div
                  class="feature-image"
                  style:background={artifact.image?.dominantColor ?? '#d8cabb'}
                >
                  {#if artifact.image}
                    <img
                      src={artifact.image.src}
                      srcset={artifact.image.srcset || undefined}
                      sizes="(max-width: 700px) 82vw, (max-width: 1200px) 32vw, 384px"
                      width={artifact.image.width}
                      height={artifact.image.height}
                      alt={artifact.image.alt}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchpriority={index === 0 ? 'high' : 'auto'}
                    />
                  {/if}
                </div>
                <h3 class="editorial-title">{artifact.title}</h3>
                <p>{artifact.culture ?? artifact.origin}</p>
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </section>
  {/if}
  <section class="preview page-shell">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Discover more</p>
        <h2 class="editorial-title">Across the collection</h2>
      </div>
      <a href="/gallery">View the full archive →</a>
    </div>
    {#if data.preview.length}<MasonryGrid items={data.preview} />{:else}<div class="empty">
        <p class="editorial-title">The first reviewed artifacts will appear here.</p>
        <a href="/about">Learn how Culturio preserves source integrity</a>
      </div>{/if}
  </section>
</main>

<style>
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(20rem, 0.65fr);
    align-items: end;
    gap: clamp(2rem, 8vw, 8rem);
    padding-block: clamp(4rem, 10vw, 10rem);
  }
  .hero h1 {
    font-size: clamp(4rem, 9.5vw, 9.5rem);
    line-height: 0.78;
    margin: 0.6rem 0 0;
  }
  .support {
    padding-bottom: 0.5rem;
  }
  .support > p {
    font-size: 1.1rem;
    line-height: 1.65;
    color: var(--color-muted);
  }
  .support > div {
    display: flex;
    gap: 1.1rem;
    align-items: center;
    margin-top: 1.5rem;
  }
  .support a {
    font-size: 0.85rem;
  }
  .support .primary {
    background: var(--color-ink);
    color: white;
    border-radius: 999px;
    padding: 0.8rem 1.1rem;
  }
  .featured,
  .preview {
    padding-bottom: clamp(5rem, 10vw, 10rem);
  }
  .section-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  .section-heading h2 {
    font-size: clamp(2.8rem, 6vw, 5.5rem);
    line-height: 0.9;
    margin: 0.25rem 0 0;
  }
  .section-heading a {
    font-size: 0.85rem;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .carousel-controls {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }
  .carousel-count {
    margin-right: 0.35rem;
    color: var(--color-muted);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
  }
  .carousel-controls button {
    display: grid;
    width: 2.7rem;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid var(--color-line);
    border-radius: 50%;
    background: transparent;
    color: var(--color-ink);
    font-size: 1.2rem;
    cursor: pointer;
    transition:
      background 180ms ease,
      color 180ms ease,
      opacity 180ms ease;
  }
  .carousel-controls button:not(:disabled):hover {
    background: var(--color-ink);
    color: var(--color-paper);
  }
  .carousel-controls button:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .feature-viewport {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  .feature-viewport::-webkit-scrollbar {
    display: none;
  }
  .feature-track {
    display: flex;
    gap: clamp(0.8rem, 1.5vw, 1.25rem);
    width: max-content;
    min-width: 100%;
    margin: 0;
    padding: 0 0 0.75rem;
  }
  .feature-card {
    flex: 0 0 clamp(16rem, 29vw, 24rem);
    min-width: 0;
    scroll-snap-align: start;
  }
  .feature-card a {
    display: block;
    height: 100%;
  }
  .feature-image {
    display: grid;
    width: 100%;
    aspect-ratio: 4 / 3;
    place-items: center;
    overflow: hidden;
    border-radius: 0.35rem;
  }
  .feature-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.5s ease;
  }
  .feature-card a:hover img {
    transform: scale(1.035);
  }
  .feature-card h3 {
    font-size: 1.45rem;
    line-height: 1;
    margin: 0.7rem 0 0.15rem;
  }
  .feature-card p {
    font-size: 0.75rem;
    color: var(--color-muted);
  }
  .empty {
    display: grid;
    place-items: center;
    text-align: center;
    min-height: 20rem;
    background: #e7dfd3;
  }
  .empty p {
    font-size: 2rem;
  }
  .empty a {
    text-decoration: underline;
  }
  @media (max-width: 800px) {
    .hero {
      grid-template-columns: 1fr;
      padding-block: 4rem;
    }
    .hero h1 {
      font-size: clamp(4rem, 18vw, 7rem);
    }
    .support > div {
      align-items: flex-start;
      flex-direction: column;
    }
    .feature-card {
      flex-basis: min(82vw, 24rem);
    }
    .section-heading {
      align-items: flex-start;
      gap: 1rem;
      flex-direction: column;
    }
    .section-heading h2 {
      font-size: clamp(2.4rem, 9vw, 4rem);
    }
    .carousel-controls {
      align-self: flex-end;
      gap: 0.4rem;
    }
    .carousel-controls button {
      width: 2.35rem;
    }
  }
</style>
