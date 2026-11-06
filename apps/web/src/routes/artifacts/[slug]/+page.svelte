<script lang="ts">
  import ArtifactDetails from '$lib/components/artifacts/ArtifactDetails.svelte';
  let { data } = $props();
  let a = $derived(data.artifact);
  let json = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'VisualArtwork',
      name: a.title,
      description: a.description ?? undefined,
      artform: a.artifactType ?? undefined,
      artMedium: a.materials.join(', ') || undefined,
      temporal: a.dateDisplay ?? undefined,
      contentLocation: a.origin ? { '@type': 'Place', name: a.origin } : undefined,
      image: a.images.map((image) => image.src),
      url: `https://culturio.africa/artifacts/${a.slug}`
    }).replaceAll('<', '\\u003c')
  );
</script>

<svelte:head>
  <title>{a.title} — Culturio</title><meta
    name="description"
    content={a.description?.slice(0, 155) ??
      `Explore ${a.title}, a historical African artifact in the Culturio archive.`}
  /><link rel="canonical" href={`https://culturio.africa/artifacts/${a.slug}`} /><meta
    property="og:type"
    content="article"
  /><meta property="og:title" content={`${a.title} — Culturio`} /><meta
    property="og:description"
    content={a.description?.slice(0, 200) ?? a.dateDisplay ?? 'Historical African artifact'}
  />{#if a.images[0]}<meta property="og:image" content={a.images[0].src} />{/if}
  {@html `<script type="application/ld+json">${json}<\/script>`}
</svelte:head>
<main class="page-shell detail">
  <nav aria-label="Breadcrumb">
    <a href="/gallery">Gallery</a><span> / </span><span aria-current="page">{a.title}</span>
  </nav>
  <ArtifactDetails artifact={a} />
</main>

<style>
  .detail {
    padding-top: 2rem;
    padding-bottom: 7rem;
  }
  .detail > nav {
    margin-bottom: 2rem;
    color: var(--color-muted);
    font-size: 0.75rem;
  }
  .detail > nav a {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>
