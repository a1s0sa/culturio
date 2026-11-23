<script lang="ts">
  import { onMount } from 'svelte';
  import type { Component } from 'svelte';
  import MuseumConceptPlan from '$lib/components/museum/MuseumConceptPlan.svelte';
  import SocialMeta from '$lib/components/seo/SocialMeta.svelte';
  import { museumConcept } from '$lib/three/config/museum';

  let { data } = $props();
  let BlockoutScene = $state<Component | null>(null);
  let rendererState = $state<'idle' | 'loading' | 'ready' | 'unsupported' | 'error'>('idle');
  let webglSupported = false;
  let showConstruction = $derived(data.showConstructionNotice);

  onMount(() => {
    if (showConstruction) return;

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
  <title
    >{showConstruction ? 'Museum in the making — Culturio' : 'Museum blockout — Culturio'}</title
  >
  <meta
    name="description"
    content={showConstruction
      ? 'The Culturio virtual museum is under construction. Explore the architectural concept and planned visitor journey.'
      : 'Explore the interactive architectural blockout and visitor journey planned for Culturio’s virtual museum.'}
  />
  <link rel="canonical" href="https://culturio.africa/museum" />
</svelte:head>
<SocialMeta
  title={showConstruction ? 'Museum in the making — Culturio' : 'Museum blockout — Culturio'}
  description={showConstruction
    ? 'The Culturio virtual museum is under construction. Explore the architectural concept and planned visitor journey.'
    : 'Explore the interactive architectural blockout and visitor journey planned for Culturio’s virtual museum.'}
  url="https://culturio.africa/museum"
  image="https://culturio.africa/opengraph/culturio-museum.jpg"
  imageAlt="Culturio's virtual museum concept"
/>

<main>
  <section class="museum-hero page-shell">
    <div class="hero-copy">
      <p class="eyebrow">
        {showConstruction ? 'The Culturio virtual museum' : 'Architectural checkpoint 02'}
      </p>
      {#if showConstruction}<div class="status-pill"><span></span> Construction ongoing</div>{/if}
      <h1 class="editorial-title">
        {showConstruction
          ? 'A place for the stories behind the objects.'
          : 'A procession from shade into light.'}
      </h1>
      {#if showConstruction}
        <p class="hero-intro">
          We’re shaping a virtual museum for African heritage. The architectural concept is taking
          form; the walk-through and exhibition spaces are still being built.
        </p>
      {:else}
        <p class="hero-intro">
          The approved concept is now a navigable low-poly study. It tests massing, scale,
          circulation, daylight openings, and the transition from the lobby into the main hall.
        </p>
      {/if}
      <a class="plan-link" href="#plan">Explore the museum plan <span aria-hidden="true">↓</span></a
      >
    </div>
    {#if showConstruction}<div
        class="construction-art"
        role="img"
        aria-label="Illustration of a museum under construction"
      >
        <div class="art-caption"><span>Concept study</span><span>01 / 04</span></div>
        <svg viewBox="0 0 680 510" fill="none" aria-hidden="true">
          <path class="sky" d="M0 0h680v510H0z" />
          <circle class="sun" cx="514" cy="107" r="50" />
          <path class="back-building" d="M92 324V173l249-104 250 104v151" />
          <path class="roof" d="m67 181 274-116 275 116-275 114L67 181Z" />
          <path
            class="building"
            d="M112 190v134m459-134v134M156 209v115m371-115v115M204 229v95m275-95v95M252 249v75m179-75v75"
          />
          <path class="arch" d="M280 324v-47c0-35 27-63 61-63s61 28 61 63v47" />
          <path class="floor" d="M42 324h596l-75 118H117L42 324Z" />
          <path
            class="floor-lines"
            d="m117 442 75-118m69 118 42-118m78 118-8-118m100 118-42-118m101 118-75-118M42 324h596M83 383h514"
          />
          <path
            class="scaffold"
            d="M546 145v179m24-167v167m-24-125h24m-24 43h24m-24 43h24m-35-126 47-24m-47 62 47-24m-47 62 47-24"
          />
          <path
            class="scaffold"
            d="M104 174v150m-23-139v139m23-101H81m23 45H81m23 45H81m33-105-43-22m43 59-43-22m43 59-43-22"
          />
          <path class="person" d="M340 367v46m-12-33 12-9 12 9m-12 33-12 22m12-22 12 22" />
          <path class="plan-lines" d="M516 410h103m-103 14h63m-63 14h82" />
          <path class="crane" d="M484 72h140m-100 0v44m-20-44v28h97m-28-28 18-19m-50 19-19-16" />
          <path class="birds" d="m183 102 9-7 9 7m18-15 7-5 7 5" />
        </svg>
        <div class="art-footnote">
          <span>Shade → threshold → light</span><span>Site plan in progress</span>
        </div>
      </div>{/if}
  </section>

  <section id="plan" class="concept-grid page-shell" aria-labelledby="plan-heading">
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
        {#each museumConcept.spaces.slice(1) as space (space.name)}
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
    {#if showConstruction}
      <div class="renderer-heading">
        <div>
          <p class="eyebrow">04 · Navigable blockout</p>
          <h2 id="renderer-heading" class="editorial-title">A 3D walk-through is on its way.</h2>
        </div>
        <p>
          The interactive walk-through is being built from the architectural concept. When it opens,
          visitors will be able to explore the entrance, lobby, connecting passage, and circular
          forum.
        </p>
      </div>

      <div class="renderer-idle" role="status">
        <div class="work-icon" aria-hidden="true"><span></span><span></span><span></span></div>
        <p class="eyebrow">Walk-through in development</p>
        <h3 class="editorial-title">The doors aren’t open yet.</h3>
        <p>
          We’re turning the architectural study into a navigable 3D space. The concept plan above
          shows what’s taking shape.
        </p>
        <a href="#plan" class="plan-button">See the plan</a>
      </div>
    {:else}
      <div class="renderer-heading">
        <div>
          <p class="eyebrow">04 · Navigable blockout</p>
          <h2 id="renderer-heading" class="editorial-title">
            Walk the revised plan at human scale.
          </h2>
        </div>
        <p>
          Guided viewpoints cover the entrance, lobby, hall, and overhead plan. Desktop visitors can
          also use pointer-lock WASD navigation; touch devices use guided viewpoints and drag-look.
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
          <p>
            No gallery functionality is affected. You can retry or continue browsing the archive.
          </p>
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
    {/if}
  </section>

  <section class="review page-shell" aria-labelledby="review-heading">
    <p class="eyebrow">The vision</p>
    <h2 id="review-heading" class="editorial-title">What we’re building toward.</h2>
    <p>
      A welcoming entrance, a light-filled lobby, a quieter connecting passage, and a circular forum
      for gathering and discovery. We’ll bring these spaces to life in 3D as the museum develops.
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
    grid-template-columns: minmax(20rem, 0.88fr) minmax(28rem, 1.12fr);
    gap: clamp(2rem, 6vw, 6rem);
    align-items: center;
    min-height: min(44rem, calc(100svh - 4.65rem));
    padding-block: clamp(2.5rem, 5vw, 5rem);
  }
  .museum-hero h1 {
    max-width: 10ch;
    margin: 1rem 0 0;
    font-size: clamp(3.8rem, 6.2vw, 6.7rem);
    line-height: 0.88;
  }
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    margin-top: 1.5rem;
    padding: 0.55rem 0.85rem;
    border: 1px solid #b37a5d;
    border-radius: 999px;
    background: #eee1d3;
    color: #70442f;
    font-size: 0.76rem;
    font-weight: 600;
  }
  .status-pill span {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: #a9603d;
    box-shadow: 0 0 0 0.22rem #a9603d22;
  }
  .hero-intro {
    max-width: 34rem;
    margin: 1.5rem 0 0;
    color: var(--color-muted);
    font-size: 1rem;
    line-height: 1.7;
  }
  .plan-link {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    margin-top: 1.5rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-bronze);
    color: var(--color-ink);
    font-size: 0.86rem;
  }
  .plan-link span {
    color: var(--color-bronze);
    font-size: 1.2rem;
  }
  .construction-art {
    position: relative;
    overflow: hidden;
    padding: 1.1rem 1.1rem 0.8rem;
    border: 1px solid #d0b8a1;
    border-radius: 1.6rem;
    background: #dfcbb5;
    box-shadow: 0 1.2rem 3rem #4c33211c;
  }
  .construction-art svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .construction-art .sky {
    fill: #e9d9c6;
  }
  .construction-art .sun {
    fill: #c98258;
    opacity: 0.72;
  }
  .construction-art .back-building {
    stroke: #714b38;
    stroke-width: 5;
    opacity: 0.45;
  }
  .construction-art .roof {
    fill: #9b6042;
    stroke: #633c2d;
    stroke-width: 5;
  }
  .construction-art .building {
    stroke: #714b38;
    stroke-width: 12;
    stroke-linecap: round;
  }
  .construction-art .arch {
    stroke: #e9d9c6;
    stroke-width: 9;
  }
  .construction-art .floor {
    fill: #c59170;
  }
  .construction-art .floor-lines {
    stroke: #9b6042;
    stroke-width: 2;
    opacity: 0.75;
  }
  .construction-art .scaffold,
  .construction-art .crane {
    stroke: #69574a;
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .construction-art .person {
    stroke: #49372d;
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .construction-art .plan-lines {
    stroke: #714b38;
    stroke-width: 3;
    stroke-linecap: round;
    opacity: 0.65;
  }
  .construction-art .birds {
    stroke: #88684f;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .art-caption,
  .art-footnote {
    display: flex;
    justify-content: space-between;
    color: #6d5443;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .art-caption {
    padding: 0.2rem 0.25rem 0.65rem;
  }
  .art-footnote {
    padding: 0.65rem 0.25rem 0.2rem;
    letter-spacing: 0.04em;
    text-transform: none;
  }
  .hero-copy > .eyebrow {
    margin: 0;
  }
  .hero-copy p,
  .lighting > p,
  .renderer-heading > p,
  .review > p,
  .plan-copy > p {
    color: var(--color-muted);
    line-height: 1.75;
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
  .renderer-idle p {
    color: var(--color-muted);
  }
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
  .renderer-idle {
    justify-items: center;
    align-content: center;
    min-height: 25rem;
    padding: 3rem 1.5rem;
    border-color: #d4bcaa;
    border-radius: 1.4rem;
    background: radial-gradient(circle at 50% 15%, #f2e6d8, #e9dfd1 67%);
    text-align: center;
  }
  .renderer-idle .eyebrow {
    margin: 1.1rem 0 0;
  }
  .renderer-idle h3 {
    margin: 0.5rem 0;
    font-size: clamp(2rem, 4vw, 3.2rem);
  }
  .renderer-idle > p:not(.eyebrow) {
    max-width: 36rem;
    line-height: 1.7;
  }
  .work-icon {
    display: flex;
    align-items: end;
    justify-content: center;
    gap: 0.4rem;
    height: 3.3rem;
  }
  .work-icon span {
    display: block;
    width: 0.75rem;
    border: 1px solid #80543e;
    border-radius: 0.2rem 0.2rem 0 0;
    background: #bd8768;
  }
  .work-icon span:nth-child(1) {
    height: 1.6rem;
  }
  .work-icon span:nth-child(2) {
    height: 2.8rem;
  }
  .work-icon span:nth-child(3) {
    height: 2.1rem;
  }
  .plan-button {
    margin-top: 0.6rem;
    padding: 0.75rem 1.1rem;
    border-radius: 999px;
    background: var(--color-ink);
    color: var(--color-paper);
    font-size: 0.82rem;
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
      grid-template-columns: 1fr;
      padding-top: 3rem;
    }
    .construction-art {
      max-width: 42rem;
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
