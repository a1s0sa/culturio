<script lang="ts">
  import ArtifactDetails from '$lib/components/artifacts/ArtifactDetails.svelte';
  import SocialMeta from '$lib/components/seo/SocialMeta.svelte';
  import { serializeJsonLd } from '$lib/seo/json-ld';
  let { data } = $props();
  let a = $derived(data.artifact);
  let json = $derived(
    serializeJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'VisualArtwork',
          name: a.title,
          description: a.description ?? undefined,
          artform: a.artifactType ?? undefined,
          artMedium: a.materials.length ? a.materials.join(', ') : undefined,
          dateCreated: a.dateDisplay ?? undefined,
          contentLocation: a.origin ? { '@type': 'Place', name: a.origin } : undefined,
          image: a.images.length ? a.images.map((image) => image.src) : undefined,
          sameAs: a.sources.length ? a.sources.map((source) => source.url) : undefined,
          url: `https://culturio.africa/artifacts/${a.slug}`,
          isPartOf: { '@type': 'WebSite', name: 'Culturio', url: 'https://culturio.africa/' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://culturio.africa/' },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Gallery',
              item: 'https://culturio.africa/gallery'
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: a.title,
              item: `https://culturio.africa/artifacts/${a.slug}`
            }
          ]
        }
      ]
    })
  );
</script>

<svelte:head>
  <title>{a.title} — Culturio</title><meta
    name="description"
    content={a.description?.slice(0, 155) ??
      `Explore ${a.title}, a historical African artifact in the Culturio archive.`}
  /><link rel="canonical" href={`https://culturio.africa/artifacts/${a.slug}`} />
  />{@html `<script type="application/ld+json">${json}<\/script>`}
</svelte:head>
<SocialMeta
  title={`${a.title} — Culturio`}
  description={a.description?.slice(0, 200) ?? a.dateDisplay ?? 'Historical African artifact'}
  url={`https://culturio.africa/artifacts/${a.slug}`}
  image="https://culturio.africa/opengraph/culturio-home-1.jpg"
  imageAlt="Culturio's archive of African artifacts"
  type="article"
  imageWidth={600}
  imageHeight={600}
/>
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
