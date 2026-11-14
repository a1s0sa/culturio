<script lang="ts">
  import { page } from '$app/state';
  import { onMount, untrack } from 'svelte';
  import type { ArtifactCardView } from '@culturio/db';
  import MasonryGrid from '$lib/components/gallery/MasonryGrid.svelte';
  import LoadMore from '$lib/components/gallery/LoadMore.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let items = $state<ArtifactCardView[]>(untrack(() => data.page.items));
  let nextCursor = $state<string | null>(untrack(() => data.page.nextCursor));
  let loading = $state(false);
  let message = $state('');
  let sentinel = $state<HTMLElement>();
  let request = 0;

  $effect(() => {
    data.page;
    request += 1;
    items = data.page.items;
    nextCursor = data.page.nextCursor;
    loading = false;
    message = '';
  });

  async function loadMore() {
    if (loading || !nextCursor) return;
    loading = true;
    const id = ++request;
    const url = new URL(page.url.href);
    url.pathname = '/api/artifacts';
    url.searchParams.set('cursor', nextCursor);

    try {
      const response = await fetch(url, { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error();
      const result = (await response.json()) as {
        items: ArtifactCardView[];
        nextCursor: string | null;
      };
      if (id === request) {
        const existing = new Set(items.map((item) => item.id));
        items = [...items, ...result.items.filter((item) => !existing.has(item.id))];
        nextCursor = result.nextCursor;
        message = result.items.length
          ? `${result.items.length} more artifacts loaded`
          : 'End of archive';
      }
    } catch {
      if (id === request) message = 'Unable to load more artifacts. Try again.';
    } finally {
      if (id === request) loading = false;
    }
  }

  onMount(() => {
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: '700px 0px' }
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      request += 1;
    };
  });

  const ideas = [
    ['Benin bronzes', 'Benin bronze'],
    ['Nok terracotta', 'Nok terracotta'],
    ['Gold and brass', 'gold brass'],
    ['Textile traditions', 'textile'],
    ['Royal arts', 'royal'],
    ['Carved figures', 'carved figure']
  ];
</script>

<svelte:head>
  <title>{data.query ? `Search “${data.query}”` : 'Search the archive'} — Culturio</title>
  <meta
    name="description"
    content="Search Culturio’s archive of African artifacts by object, culture, material, place, or period."
  />
  <meta name="robots" content={page.url.search ? 'noindex,follow' : 'index,follow'} />
  <link rel="canonical" href="https://culturio.africa/search" />
</svelte:head>

<main class="page-shell">
  <section class="search-hero" aria-labelledby="search-title">
    <p class="eyebrow">A collection of stories</p>
    <h1 id="search-title" class="editorial-title">
      {data.query ? `Explore ${data.query}` : 'What would you like to discover?'}
    </h1>
    <p class="intro">
      Search objects, cultures, materials, places, and the histories between them.
    </p>
    <form action="/search" method="GET" role="search">
      <label class="sr-only" for="archive-search">Search the archive</label>
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="m21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
      </svg>
      <input
        id="archive-search"
        type="search"
        name="q"
        value={data.query}
        placeholder="Try “Benin bronze” or “Nok terracotta”"
        autocomplete="off"
      />
      <button type="submit">Search</button>
    </form>
    <div class="ideas" aria-label="Suggested searches">
      <span>Try a search</span>
      {#each ideas as [label, term] (term)}
        <a href={`/search?q=${encodeURIComponent(term)}`}>{label}</a>
      {/each}
    </div>
  </section>

  <section class="results" aria-labelledby="results-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">From the archive</p>
        <h2 id="results-title" class="editorial-title">
          {data.query ? `Results for “${data.query}”` : 'A few places to begin'}
        </h2>
      </div>
      <p class="count" aria-live="polite">
        {items.length ? `${items.length} artifacts shown` : 'No matching artifacts yet'}
      </p>
    </div>

    {#if items.length}
      <MasonryGrid {items} />
      <div bind:this={sentinel} class="sentinel" aria-hidden="true"></div>
      <LoadMore onclick={loadMore} {loading} disabled={!nextCursor} />
      <p class="sr-only" aria-live="polite">{message}</p>
    {:else}
      <div class="empty">
        <p class="editorial-title">No objects found for this search.</p>
        <p>Try another word or browse the complete collection.</p>
        <a href="/gallery">Explore all artifacts</a>
      </div>
    {/if}
  </section>
</main>

<style>
  .search-hero {
    padding: clamp(3.5rem, 9vw, 8rem) 0 3rem;
    text-align: center;
  }
  .search-hero h1 {
    max-width: 58rem;
    margin: 0.4rem auto 0;
    font-size: clamp(3.2rem, 8vw, 7rem);
    line-height: 0.9;
  }
  .intro {
    margin: 1.25rem 0 2rem;
    color: var(--color-muted);
  }
  form {
    position: relative;
    display: flex;
    align-items: center;
    width: min(100%, 48rem);
    margin: 0 auto;
    padding: 0.4rem;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: var(--color-paper);
    box-shadow: 0 8px 30px #211d190c;
  }
  form svg {
    flex: 0 0 auto;
    width: 1.2rem;
    margin-left: 0.8rem;
    fill: none;
    stroke: var(--color-muted);
    stroke-width: 1.7;
  }
  input {
    flex: 1;
    min-width: 0;
    padding: 0.8rem;
    border: 0;
    outline: 0;
    background: transparent;
  }
  input:focus-visible {
    outline: 0;
  }
  form:focus-within {
    outline: 2px solid var(--color-bronze);
    outline-offset: 3px;
  }
  button {
    flex: 0 0 auto;
    padding: 0.75rem 1.2rem;
    border: 0;
    border-radius: 999px;
    background: var(--color-ink);
    color: var(--color-paper);
    cursor: pointer;
  }
  .ideas {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.25rem;
  }
  .ideas span {
    color: var(--color-muted);
    font-size: 0.8rem;
  }
  .ideas a {
    padding: 0.45rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-paper) 75%, transparent);
    font-size: 0.78rem;
  }
  .ideas a:hover {
    border-color: var(--color-bronze);
    color: var(--color-bronze);
  }
  .results {
    padding-bottom: clamp(5rem, 9vw, 9rem);
  }
  .section-heading {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .section-heading h2 {
    margin: 0.25rem 0 0;
    font-size: clamp(2.4rem, 5vw, 4.5rem);
    line-height: 0.95;
  }
  .count {
    color: var(--color-muted);
    font-size: 0.78rem;
  }
  .sentinel {
    height: 1px;
  }
  .empty {
    display: grid;
    justify-items: center;
    gap: 0.5rem;
    padding: 5rem 1rem;
    background: #e7dfd3;
    text-align: center;
  }
  .empty p {
    margin: 0;
    color: var(--color-muted);
  }
  .empty .editorial-title {
    color: var(--color-ink);
    font-size: 1.8rem;
  }
  .empty a {
    margin-top: 0.75rem;
    color: var(--color-bronze);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  @media (max-width: 700px) {
    main {
      padding-bottom: 4rem;
    }
    .search-hero {
      padding-top: 3rem;
    }
    .search-hero h1 {
      font-size: clamp(3rem, 14vw, 5rem);
    }
    .intro {
      max-width: 25rem;
      margin-inline: auto;
      font-size: 0.9rem;
      line-height: 1.55;
    }
    input {
      padding-inline: 0.55rem;
      font-size: 0.9rem;
    }
    button {
      padding-inline: 0.85rem;
      font-size: 0.85rem;
    }
    .section-heading {
      align-items: start;
      flex-direction: column;
    }
    .count {
      margin: 0;
    }
  }
</style>
