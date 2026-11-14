<script lang="ts">
  import SocialMeta from '$lib/components/seo/SocialMeta.svelte';
</script>

<svelte:head
  ><title>About — Culturio</title><meta
    name="description"
    content="How Culturio preserves provenance, uncertainty, and cultural heritage rights."
  /><link rel="canonical" href="https://culturio.africa/about" /></svelte:head
>
<SocialMeta
  title="About — Culturio"
  description="How Culturio preserves provenance, uncertainty, and cultural heritage rights."
  url="https://culturio.africa/about"
  image="https://culturio.africa/opengraph/culturio-about.jpg"
  imageAlt="Culturio's mission to preserve provenance and cultural heritage"
/>
<main class="page-shell prose">
  <p class="eyebrow">About Culturio</p>
  <h1 class="editorial-title">An archive built around provenance.</h1>
  <p class="lead">
    Culturio makes historical African artifacts easier to discover while preserving the context,
    uncertainty, and rights attached to every record.
  </p>
  <section>
    <h2 class="editorial-title">Source before certainty</h2>
    <p>
      Records retain their museum source, attribution, historical date language, and geographical
      uncertainty. Culturio does not turn an approximate claim into a precise fact.
    </p>
  </section>
  <section>
    <h2 class="editorial-title">Images with permission</h2>
    <p>
      Only explicitly redistributable media is hosted. When rights are missing or unclear, the
      archive keeps a source reference without copying the image.
    </p>
  </section>
  <section>
    <h2 class="editorial-title">Open software, distinct content rights</h2>
    <p>
      The Culturio software is open source. Museum metadata and imagery continue to carry their own
      licenses and institutional attribution.
    </p>
  </section>
</main>

<style>
  .prose {
    max-width: 58rem;
    padding-block: clamp(4rem, 10vw, 10rem);
  }
  h1 {
    font-size: clamp(4rem, 10vw, 8.5rem);
    line-height: 0.8;
    margin: 0.5rem 0 2rem;
  }
  .lead {
    font-size: 1.35rem;
    line-height: 1.55;
    color: var(--color-muted);
    max-width: 42rem;
  }
  section {
    margin-top: 4rem;
    max-width: 40rem;
  }
  section h2 {
    font-size: 2.5rem;
    margin-bottom: 0.6rem;
  }
  section p {
    line-height: 1.75;
    color: #494038;
  }
</style>
