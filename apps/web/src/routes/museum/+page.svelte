<script lang="ts">
  import { onMount } from 'svelte';
  import type { Component } from 'svelte';
  import MuseumConceptPlan from '$lib/components/museum/MuseumConceptPlan.svelte';
  import SocialMeta from '$lib/components/seo/SocialMeta.svelte';
  import { museumConcept } from '$lib/three/config/museum';

  let BlockoutScene = $state<Component | null>(null);
  let rendererState = $state<'idle' | 'loading' | 'ready' | 'unsupported' | 'error'>('idle');
  let webglSupported = $state(false);

  onMount(() => {
    const canvas = document.createElement('canvas');
    webglSupported = Boolean(
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ??
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
    );

    if (webglSupported && new URLSearchParams(window.location.search).has('blockout')) {
      void loadBlockout();
    }
  });

  async function loadBlockout() {
    if (!webglSupported) {
      rendererState = 'unsupported';
      return;
    }

    rendererState = 'loading';
    try {
      const module = await import('$lib/three/MuseumBlockout.svelte');
      BlockoutScene = module.default;
      rendererState = 'ready';
    } catch {
      rendererState = 'error';
    }
  }
</script>

<svelte:head>
  <title>Museum Blockout — Culturio</title>
  <meta
    name="description"
    content="Explore and review the approved architectural concept as a low-poly museum blockout."
  />
  <link rel="canonical" href="https://culturio.africa/museum" />
</svelte:head>
<SocialMeta
  title="Museum Blockout — Culturio"
  description="Explore and review Culturio's architectural concept for a virtual museum."
  url="https://culturio.africa/museum"
  image="https://culturio.africa/opengraph/culturio-museum.jpg"
  imageAlt="Culturio's virtual museum concept"
/>

<main>
  <section class="museum-hero page-shell">
    <div>
      <p class="eyebrow">Architectural checkpoint 02</p>
      <h1 class="editorial-title">A procession from shade into light.</h1>
    </div>
    <div class="hero-copy">
      <p>
        The approved concept is now a navigable low-poly study. It tests massing, scale,
        circulation, daylight openings, and the transition from the lobby into the main hall—without
        detailed materials or exhibition content.
      </p>
      <span>Blockout awaiting architectural approval</span>
    </div>
  </section>

  <section class="concept-grid page-shell" aria-labelledby="plan-heading">
    <div class="plan-copy">
      <p class="eyebrow">01 · Spatial sequence</p>
      <h2 id="plan-heading" class="editorial-title">Simple orientation, changing scale.</h2>
      <p>
        A recessed five-metre entrance opens into a tall lobby. A lower, narrower passage then
        compresses the view before releasing into a forty-four metre circular forum. Concentric
        steps draw visitors toward a sunken public center while the perimeter remains available for
        future exhibits.
      </p>
      <dl>
        {#each museumConcept.spaces.slice(1) as space}
          <div>
            <dt>{space.name}</dt>
            <dd>{space.width} × {space.depth} × {space.height} m</dd>
          </div>
        {/each}
      </dl>
    </div>
    <MuseumConceptPlan />
  </section>

  <section class="features page-shell" aria-labelledby="features-heading">
    <div class="section-heading">
      <p class="eyebrow">02 · Architectural language</p>
      <h2 id="features-heading" class="editorial-title">Monumental, warm, restrained.</h2>
    </div>
    <div class="feature-list">
      <article>
        <span>Entry</span>
        <h3>Two weighty volumes frame a deep reveal.</h3>
        <p>The approach should feel ceremonial through scale and shadow, not applied ornament.</p>
      </article>
      <article>
        <span>Lobby</span>
        <h3>A linear roof light traces the main route.</h3>
        <p>Soft daylight reveals warm surfaces while preserving a clear direction to the hall.</p>
      </article>
      <article>
        <span>Hall</span>
        <h3>A circular forum organizes gathering and discovery.</h3>
        <p>A sunken center, ring balcony, and perimeter route preserve flexible exhibit space.</p>
      </article>
    </div>
  </section>

  <section class="lighting page-shell" aria-labelledby="lighting-heading">
    <div>
      <p class="eyebrow">03 · Light and atmosphere</p>
      <h2 id="lighting-heading" class="editorial-title">Daylight leads. Gallery light recedes.</h2>
    </div>
    <p>
      The lobby uses the entrance and roof slot for broad, warm illumination. The passage is
      intentionally quieter. The circular forum concentrates daylight through a central skylight.
      Brick-toned stepped rings, columns, and perforated upper screens shape the light without
      introducing detailed textures or exhibit lighting yet.
    </p>
  </section>

  <section class="renderer page-shell" aria-labelledby="renderer-heading">
    <div class="renderer-heading">
      <div>
        <p class="eyebrow">04 · Navigable blockout</p>
        <h2 id="renderer-heading" class="editorial-title">Walk the revised plan at human scale.</h2>
      </div>
      <p>
        Four repeatable cameras cover the entrance, lobby, hall, and overhead plan. Desktop visitors
        can also use pointer-lock WASD navigation; touch devices use guided viewpoints and
        drag-look. The renderer still loads only when requested.
      </p>
    </div>

    {#if rendererState === 'ready' && BlockoutScene}
      <BlockoutScene />
    {:else if rendererState === 'unsupported'}
      <div class="renderer-fallback" role="status">
        <h3>WebGL is unavailable on this device.</h3>
        <p>The architectural proposal remains available above, or you can visit the gallery.</p>
        <a href="/gallery">Return to the digital gallery</a>
      </div>
    {:else if rendererState === 'error'}
      <div class="renderer-fallback" role="alert">
        <h3>The renderer could not start.</h3>
        <p>No gallery functionality is affected. You can retry or continue browsing the archive.</p>
        <button type="button" onclick={loadBlockout}>Retry blockout</button>
      </div>
    {:else}
      <div class="renderer-idle">
        <p>The architectural blockout is ready to load.</p>
        <button type="button" onclick={loadBlockout} disabled={rendererState === 'loading'}>
          {rendererState === 'loading' ? 'Loading museum blockout…' : 'Enter the blockout'}
        </button>
      </div>
    {/if}
  </section>

  <section class="review page-shell" aria-labelledby="review-heading">
    <p class="eyebrow">Review gate</p>
    <h2 id="review-heading" class="editorial-title">The blockout is ready for your review.</h2>
    <p>
      Please test the entrance massing, lobby height, roof-light slot, passage compression, hall
      diameter, sunken forum depth, ring balcony, perforated upper enclosure, central skylight, and
      circulation. Detailed geometry and final materials remain blocked until you explicitly approve
      this complete architectural layout.
    </p>
    <a href="/gallery">Keep exploring the gallery</a>
  </section>
</main>

<style>
  main {
    overflow: hidden;
  }
  .museum-hero,
  .concept-grid,
  .features,
  .lighting,
  .renderer,
  .review {
    padding-block: clamp(4rem, 9vw, 8rem);
  }
  .museum-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.65fr);
    gap: clamp(2rem, 7vw, 8rem);
    align-items: end;
    min-height: min(48rem, calc(100svh - 5rem));
  }
  .museum-hero h1 {
    max-width: 12ch;
    margin: 0.6rem 0 0;
    font-size: clamp(4rem, 9vw, 9.5rem);
    line-height: 0.84;
  }
  .hero-copy p,
  .lighting > p,
  .renderer-heading > p,
  .review > p,
  .plan-copy > p {
    color: var(--color-muted);
    line-height: 1.75;
  }
  .hero-copy span {
    display: inline-block;
    margin-top: 1.5rem;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid var(--color-bronze);
    color: var(--color-bronze);
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .concept-grid {
    display: grid;
    grid-template-columns: minmax(18rem, 0.65fr) minmax(24rem, 1.35fr);
    gap: clamp(3rem, 8vw, 9rem);
    align-items: center;
    border-top: 1px solid var(--color-line);
  }
  h2 {
    margin: 0.65rem 0 1.3rem;
    font-size: clamp(2.8rem, 5vw, 5.5rem);
    line-height: 0.92;
  }
  dl {
    margin: 2.5rem 0 0;
  }
  dl div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-block: 0.9rem;
    border-top: 1px solid var(--color-line);
  }
  dt {
    font-size: 0.85rem;
  }
  dd {
    margin: 0;
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
  }
  .features {
    border-top: 1px solid var(--color-line);
  }
  .section-heading {
    max-width: 52rem;
  }
  .feature-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin-top: clamp(3rem, 7vw, 6rem);
    border-top: 1px solid var(--color-line);
  }
  article {
    padding: 2rem 2rem 0 0;
  }
  article + article {
    padding-left: 2rem;
    border-left: 1px solid var(--color-line);
  }
  article span {
    color: var(--color-bronze);
    font-size: 0.72rem;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
  h3 {
    margin: 1.4rem 0 1rem;
    font-family: var(--font-serif);
    font-size: clamp(1.7rem, 2.5vw, 2.4rem);
    font-weight: 500;
    line-height: 1.05;
  }
  article p {
    color: var(--color-muted);
    font-size: 0.9rem;
    line-height: 1.65;
  }
  .lighting,
  .renderer-heading {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(3rem, 10vw, 11rem);
    align-items: end;
  }
  .lighting {
    width: 100%;
    max-width: none;
    padding-inline: max(1rem, calc((100% - 96rem) / 2));
    background: #2a211c;
    color: var(--color-paper);
  }
  .lighting .eyebrow {
    color: #d09a76;
  }
  .renderer-heading {
    margin-bottom: 2.5rem;
  }
  .renderer-idle,
  .renderer-fallback {
    display: grid;
    place-items: center;
    min-height: 24rem;
    padding: 2rem;
    border: 1px solid var(--color-line);
    border-radius: 1.2rem;
    background: #e9dfd1;
    text-align: center;
  }
  .renderer-idle p,
  .renderer-fallback p {
    color: var(--color-muted);
  }
  button,
  .renderer-fallback a,
  .review a {
    display: inline-flex;
    justify-content: center;
    margin-top: 1rem;
    padding: 0.8rem 1.1rem;
    border: 1px solid var(--color-ink);
    border-radius: 999px;
    background: var(--color-ink);
    color: var(--color-paper);
    cursor: pointer;
  }
  button:disabled {
    cursor: wait;
    opacity: 0.65;
  }
  .review {
    max-width: 68rem;
    border-top: 1px solid var(--color-line);
  }
  .review a {
    background: transparent;
    color: var(--color-ink);
  }

  @media (max-width: 800px) {
    .museum-hero,
    .concept-grid,
    .lighting,
    .renderer-heading {
      grid-template-columns: 1fr;
    }
    .museum-hero {
      min-height: auto;
      padding-top: 7rem;
    }
    .concept-grid {
      gap: 3rem;
    }
    .feature-list {
      grid-template-columns: 1fr;
    }
    article,
    article + article {
      padding: 1.5rem 0;
      border-left: 0;
      border-bottom: 1px solid var(--color-line);
    }
  }
  @media (max-width: 480px) {
    .museum-hero h1 {
      font-size: clamp(3.5rem, 19vw, 5rem);
    }
    dl div {
      display: block;
    }
    dd {
      margin-top: 0.3rem;
    }
  }
</style>
