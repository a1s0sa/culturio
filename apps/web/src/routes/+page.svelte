<script lang="ts">
  import MasonryGrid from '$lib/components/gallery/MasonryGrid.svelte';
  import { revealOnScroll } from '$lib/actions/reveal-on-scroll';
  import { serializeJsonLd } from '$lib/seo/json-ld';
  let { data } = $props();
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
</script>

<svelte:head
  ><title>Culturio — Africa's history through its artifacts</title><meta
    name="description"
    content="Discover historical objects, craftsmanship, and cultural heritage from civilizations across Africa."
  /><link rel="canonical" href="https://culturio.africa/" /><meta
    property="og:title"
    content="Culturio — Africa's history through its artifacts"
  /><meta
    property="og:description"
    content="An image-first digital archive of African cultural heritage."
  />{@html `<script type="application/ld+json">${jsonLd}<\/script>`}</svelte:head
>
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
  {#if data.featured.length}<section class="featured page-shell">
      <div class="section-heading">
        <div>
          <p class="eyebrow">From the archive</p>
          <h2 class="editorial-title">Featured artifacts</h2>
        </div>
      </div>
      <div class="feature-grid">
        {#each data.featured as artifact, index (artifact.id)}<a
            use:revealOnScroll={index % 4}
            href={`/artifacts/${artifact.slug}`}
            ><div
              class="feature-image"
              style:background={artifact.image?.dominantColor ?? '#d8cabb'}
              style:aspect-ratio={artifact.image
                ? `${artifact.image.width}/${artifact.image.height}`
                : '4/5'}
            >
              {#if artifact.image}<img
                  src={artifact.image.src}
                  srcset={artifact.image.srcset || undefined}
                  sizes={index === 0
                    ? '(max-width: 800px) 100vw, 50vw'
                    : '(max-width: 800px) 50vw, 22vw'}
                  width={artifact.image.width}
                  height={artifact.image.height}
                  alt={artifact.image.alt}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchpriority={index === 0 ? 'high' : 'auto'}
                />{/if}
            </div>
            <h3 class="editorial-title">{artifact.title}</h3>
            <p>{artifact.culture ?? artifact.origin}</p></a
          >{/each}
      </div>
    </section>{/if}
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
  .feature-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 1rem;
  }
  .feature-grid a:first-child {
    grid-row: span 2;
  }
  .feature-image {
    overflow: hidden;
    border-radius: 0.35rem;
    height: calc(100% - 4rem);
  }
  .feature-grid img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.4s;
  }
  .feature-grid a:hover img {
    transform: scale(1.02);
  }
  .feature-grid h3 {
    font-size: 1.45rem;
    line-height: 1;
    margin: 0.7rem 0 0.15rem;
  }
  .feature-grid p {
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
    .feature-grid {
      grid-template-columns: 1fr 1fr;
    }
    .feature-grid a:first-child {
      grid-column: 1/-1;
    }
    .section-heading {
      align-items: start;
      gap: 1rem;
      flex-direction: column;
    }
  }
</style>
