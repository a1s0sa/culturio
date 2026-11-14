<script lang="ts">
  import type { ArtifactDetailView } from '@culturio/db';
  import ArtifactImages from './ArtifactImages.svelte';
  import RelatedArtifacts from './RelatedArtifacts.svelte';
  let { artifact, compact = false }: { artifact: ArtifactDetailView; compact?: boolean } = $props();
  function institutionName(institution: string) {
    if (institution === 'met') return 'The Metropolitan Museum of Art';
    if (institution === 'smithsonian') return 'Smithsonian Institution';
    return institution;
  }
  let imageSources = $derived.by(() => {
    const sources: { institution: string; url: string }[] = [];
    for (const image of artifact.images) {
      if (
        image.sourceInstitution &&
        image.sourceUrl &&
        !sources.some((source) => source.institution === image.sourceInstitution)
      )
        sources.push({ institution: image.sourceInstitution, url: image.sourceUrl });
    }
    return sources;
  });
  let facts = $derived([
    ['Culture', artifact.culture],
    ['Civilization', artifact.civilization],
    ['Origin', artifact.origin],
    ['Period', artifact.period],
    ['Date', artifact.dateDisplay],
    ['Type', artifact.artifactType],
    ['Materials', artifact.materials.join(', ') || null],
    ['Dimensions', artifact.dimensions]
  ]);
</script>

<article class={{ compact }}>
  <div class="visual"><ArtifactImages images={artifact.images} title={artifact.title} /></div>
  <div class="content">
    <p class="eyebrow">{artifact.artifactType ?? 'Historical artifact'}</p>
    <h1 class="editorial-title">{artifact.title}</h1>
    {#if artifact.sources.length || imageSources.length}
      <ul class="source-badges" aria-label="Artifact sources">
        {#each artifact.sources as source (source.url)}
          <li>
            <a href={source.url} rel="external noreferrer"
              >Record · {institutionName(source.institution)}</a
            >
          </li>
        {/each}
        {#each imageSources as source (source.institution)}
          <li>
            <a href={source.url} rel="external noreferrer"
              >Image · {institutionName(source.institution)}</a
            >
          </li>
        {/each}
      </ul>
    {/if}
    {#if artifact.alternativeNames.length}<p class="aliases">
        Also known as {artifact.alternativeNames.join(', ')}
      </p>{/if}
    <dl>
      {#each facts as fact (fact[0])}{#if fact[1]}<div>
            <dt>{fact[0]}</dt>
            <dd>{fact[1]}</dd>
          </div>{/if}{/each}
    </dl>
    {#if artifact.description}<div class="description">
        <h2>About this artifact</h2>
        <p>{artifact.description}</p>
      </div>{/if}
    {#if artifact.sources.length}<section class="sources">
        <h2>Sources &amp; attribution</h2>
        {#each artifact.sources as source (source.url)}<p>
            <a href={source.url} rel="external noreferrer">{institutionName(source.institution)}</a
            >{#if source.accessionNumber}
              · {source.accessionNumber}{/if}{#if source.attribution}<br /><span
                >{source.attribution}</span
              >{/if}
          </p>{/each}
      </section>{/if}
  </div>
</article>
{#if !compact}<RelatedArtifacts items={artifact.related} />{/if}

<style>
  article {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(20rem, 0.75fr);
    gap: clamp(2rem, 6vw, 6rem);
    align-items: start;
  }
  .content {
    position: sticky;
    top: 6rem;
  }
  .content h1 {
    font-size: clamp(3.1rem, 6vw, 6.3rem);
    line-height: 0.86;
    margin: 0.5rem 0 1rem;
  }
  .aliases {
    color: var(--color-muted);
    font-style: italic;
  }
  .source-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin: 1rem 0;
    padding: 0;
    list-style: none;
  }
  .source-badges a {
    display: inline-flex;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    padding: 0.35rem 0.65rem;
    color: var(--color-ink);
    background: var(--color-ivory);
    font-size: 0.7rem;
    text-decoration: none;
  }
  .source-badges a:hover {
    border-color: var(--color-bronze);
  }
  dl {
    margin: 2rem 0;
    display: grid;
    border-top: 1px solid var(--color-line);
  }
  dl div {
    display: grid;
    grid-template-columns: 7rem 1fr;
    gap: 1rem;
    padding: 0.65rem 0;
    border-bottom: 1px solid var(--color-line);
  }
  dt {
    color: var(--color-muted);
    font-size: 0.78rem;
  }
  dd {
    margin: 0;
    font-size: 0.9rem;
  }
  .description,
  .sources {
    margin-top: 2rem;
  }
  .description h2,
  .sources h2 {
    font-family: var(--font-serif);
    font-size: 1.45rem;
  }
  .description p {
    line-height: 1.7;
    color: #433b34;
  }
  .sources p {
    font-size: 0.82rem;
    line-height: 1.5;
  }
  .sources a {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .sources span {
    color: var(--color-muted);
  }
  article.compact {
    grid-template-columns: minmax(0, 1.15fr) minmax(18rem, 0.85fr);
    gap: 2.5rem;
  }
  .compact .content h1 {
    font-size: clamp(2.5rem, 5vw, 4.5rem);
  }
  @media (max-width: 800px) {
    article,
    article.compact {
      grid-template-columns: 1fr;
    }
    .content {
      position: static;
    }
    .content h1 {
      font-size: clamp(2.8rem, 14vw, 5rem);
    }
    .visual {
      margin-inline: -1rem;
    }
  }
</style>
