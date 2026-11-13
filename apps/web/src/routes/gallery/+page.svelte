<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount, untrack } from 'svelte';
  import type { ArtifactCardView } from '@culturio/db';
  import MasonryGrid from '$lib/components/gallery/MasonryGrid.svelte';
  import GalleryFilters from '$lib/components/gallery/GalleryFilters.svelte';
  import LoadMore from '$lib/components/gallery/LoadMore.svelte';
  import ArtifactModal from '$lib/components/artifacts/ArtifactModal.svelte';
  import { serializeJsonLd } from '$lib/seo/json-ld';
  let { data } = $props();
  let items = $state<ArtifactCardView[]>(untrack(() => data.page.items));
  let nextCursor = $state<string | null>(untrack(() => data.page.nextCursor));
  let loading = $state(false);
  let message = $state('');
  let sentinel: HTMLElement;
  let request = 0;
  let jsonLd = $derived(
    serializeJsonLd({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Explore African artifacts — Culturio',
      description: 'Discover artifacts by culture, origin, period, material, and type.',
      url: 'https://culturio.africa/gallery',
      isPartOf: { '@type': 'WebSite', name: 'Culturio', url: 'https://culturio.africa/' },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: data.page.items.map((artifact, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: artifact.title,
          url: `https://culturio.africa/artifacts/${artifact.slug}`
        }))
      }
    })
  );
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
  function open(event: MouseEvent, artifact: ArtifactCardView) {
    if (!matchMedia('(min-width: 801px)').matches) return;
    event.preventDefault();
    goto(`/artifacts/${artifact.slug}`, {
      shallow: true,
      reset: false,
      state: { modalSlug: artifact.slug, returnFocusId: `artifact-${artifact.id}` }
    });
  }
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '700px 0px' }
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      request += 1;
    };
  });
</script>

<svelte:head
  ><title>Explore African artifacts — Culturio</title><meta
    name="description"
    content="Discover African historical artifacts by culture, origin, period, material, and type."
  /><meta name="robots" content={page.url.search ? 'noindex,follow' : 'index,follow'} /><link
    rel="canonical"
    href="https://culturio.africa/gallery"
  />{@html `<script type="application/ld+json">${jsonLd}<\/script>`}</svelte:head
>
<main class="page-shell">
  <header class="intro">
    <div>
      <p class="eyebrow">Digital gallery</p>
      <h1 class="editorial-title">Explore the archive</h1>
    </div>
    <p>
      Objects, craft, and histories from across the African continent. Every record retains its
      source and uncertainty.
    </p>
  </header>
  <GalleryFilters filters={data.filters} query={data.query} />
  <p class="count" aria-live="polite">
    {items.length ? `${items.length} artifacts shown` : 'No artifacts found'}
  </p>
  {#if items.length}<MasonryGrid {items} onopen={open} />{:else}<section class="empty">
      <h2 class="editorial-title">The archive is quiet here.</h2>
      <p>
        {data.query.q
          ? 'Try a broader search or clear some filters.'
          : 'Published artifacts will appear after reviewed records are available.'}
      </p>
      <a href="/gallery">Clear search and filters</a>
    </section>{/if}
  <div bind:this={sentinel} class="sentinel" aria-hidden="true"></div>
  <p class="sr-only" aria-live="polite">{message}</p>
  <LoadMore onclick={loadMore} {loading} disabled={!nextCursor} />
</main>
{#if page.state.modalSlug}<ArtifactModal
    slug={page.state.modalSlug}
    returnFocusId={page.state.returnFocusId}
  />{/if}

<style>
  .intro {
    display: grid;
    grid-template-columns: 1fr minmax(18rem, 30rem);
    gap: 2rem;
    align-items: end;
    padding: clamp(2.5rem, 7vw, 7rem) 0 1.5rem;
  }
  .intro h1 {
    font-size: clamp(3.5rem, 9vw, 8rem);
    line-height: 0.78;
    margin: 0.35rem 0 0;
  }
  .intro > p {
    color: var(--color-muted);
    line-height: 1.6;
  }
  .count {
    margin: 1.25rem 0;
    color: var(--color-muted);
    font-size: 0.75rem;
  }
  .empty {
    padding: 7rem 1rem;
    text-align: center;
  }
  .empty h2 {
    font-size: 3rem;
  }
  .empty p {
    color: var(--color-muted);
  }
  .empty a {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .sentinel {
    height: 1px;
  }
  @media (max-width: 700px) {
    main {
      padding-bottom: 4rem;
    }
    .intro {
      grid-template-columns: 1fr;
      padding: 2rem 0 1rem;
    }
    .intro h1 {
      font-size: 3.8rem;
    }
    .intro > p {
      font-size: 0.9rem;
    }
  }
</style>
