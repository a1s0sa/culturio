<script lang="ts">
  import { fly } from 'svelte/transition';
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
  let activeView = $state<'drafts' | 'published'>('drafts');
  let drafts = $derived(
    data.artifacts.filter((artifact) => artifact.publication_status === 'draft')
  );
  let published = $derived(
    data.artifacts.filter((artifact) => artifact.publication_status === 'published')
  );
</script>

<svelte:head>
  <title>Artifact moderation · Culturio</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="page-shell moderation">
  <header class="page-heading">
    <div>
      <p class="eyebrow">Culturio · editorial desk</p>
      <h1 class="editorial-title">Review the collection</h1>
      <p class="intro">
        Check provenance and image rights before an artifact enters the public collection.
      </p>
    </div>
    <p class="desk-note"><span>01</span> Every artifact is reviewed by a moderator.</p>
  </header>

  <div class="overview" aria-label="Publication overview">
    <div>
      <span class="count">{drafts.length.toString().padStart(2, '0')}</span><span
        >Awaiting review</span
      >
    </div>
    <div>
      <span class="count">{published.length.toString().padStart(2, '0')}</span><span
        >In the collection</span
      >
    </div>
    <p>
      Publication is limited to origin-confirmed records with processed, redistributable imagery.
    </p>
  </div>

  {#if form?.message}<p class="notice" role="alert">{form.message}</p>{/if}
  {#if form?.success}<p class="notice success" role="status">Publication status updated.</p>{/if}

  <nav class="views" aria-label="Moderation views">
    <button
      class={{ active: activeView === 'drafts' }}
      type="button"
      onclick={() => (activeView = 'drafts')}
    >
      Review queue <span>{drafts.length}</span>
    </button>
    <button
      class={{ active: activeView === 'published' }}
      type="button"
      onclick={() => (activeView = 'published')}
    >
      Published <span>{published.length}</span>
    </button>
  </nav>

  {#if activeView === 'drafts'}
    {#if drafts.length === 0}
      <section class="empty-state">
        <p class="eyebrow">Queue clear</p>
        <h2 class="editorial-title">Nothing is waiting for review.</h2>
        <p>New origin-confirmed artifacts will appear here after ingestion.</p>
      </section>
    {:else}
      <div class="queue">
        {#each drafts as artifact, index (artifact.id)}
          {@const hero = artifact.images.find((image) => image.previewUrl && image.eligible)}
          {@const eligible = artifact.images.some((image) => image.eligible)}
          <article
            class="review-row"
            in:fly={{ y: 12, duration: 220 }}
            out:fly={{ y: -8, duration: 180 }}
          >
            <div class="artwork">
              {#if hero}
                <img
                  src={hero.previewUrl ?? ''}
                  alt="Processed view of {artifact.title}"
                  loading="lazy"
                />
              {:else}
                <div class="no-artwork"><span>Image preview unavailable</span></div>
              {/if}
              <span class="image-count"
                >{artifact.images.length} {artifact.images.length === 1 ? 'image' : 'images'}</span
              >
            </div>

            <div class="record">
              <p class="eyebrow">
                Review {String(index + 1).padStart(2, '0')} <span>·</span> Draft
              </p>
              <h2 class="editorial-title">{artifact.title}</h2>
              <p class="origin">
                {artifact.origin ?? 'Origin not recorded'} <span>·</span>
                {artifact.date_display ?? artifact.historical_period ?? 'Period not recorded'}
              </p>

              <div class="metadata">
                <section>
                  <h3>Provenance</h3>
                  {#if artifact.sources.length}
                    {#each artifact.sources as source (`${source.institution}:${source.externalId}`)}
                      <div class="source-line">
                        <span
                          >{source.institution}{source.accessionNumber
                            ? ` · ${source.accessionNumber}`
                            : ''}</span
                        >
                        <a href={source.url} target="_blank" rel="noopener noreferrer"
                          >Source record ↗</a
                        >
                        {#if source.attribution}<p>{source.attribution}</p>{/if}
                      </div>
                    {/each}
                  {:else}
                    <p class="muted">No source attribution attached.</p>
                  {/if}
                </section>

                <section>
                  <h3>Image rights</h3>
                  {#if artifact.images.length}
                    <div class="image-rights">
                      {#each artifact.images as image (image.id)}
                        <div class="rights-line">
                          <span class={['rights-dot', { eligible: image.eligible }]}></span>
                          <div>
                            <p>
                              {image.license ?? 'License not recorded'} <span>·</span>
                              {image.status}
                            </p>
                            {#if image.licenseUrl}<a
                                href={image.licenseUrl}
                                target="_blank"
                                rel="noreferrer">Review license terms ↗</a
                              >{/if}
                            {#if image.attribution}<small>{image.attribution}</small>{/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <p class="muted">No images attached.</p>
                  {/if}
                </section>
              </div>

              <div class="row-actions">
                <a
                  class="preview-link"
                  href="/artifacts/{artifact.slug}"
                  target="_blank"
                  rel="noreferrer">Preview record ↗</a
                >
                <form method="POST" action="?/publish" use:enhance>
                  <input type="hidden" name="artifactId" value={artifact.id} />
                  <label class="note-field"
                    >Moderator note <input
                      name="note"
                      maxlength="1000"
                      placeholder="Optional"
                    /></label
                  >
                  <button type="submit" disabled={!eligible}
                    >Publish to collection <span>↗</span></button
                  >
                </form>
              </div>
              {#if !eligible}<p class="hint">
                  Publishing requires at least one processed image cleared for redistribution.
                </p>{/if}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  {:else if published.length === 0}
    <section class="empty-state">
      <p class="eyebrow">The collection</p>
      <h2 class="editorial-title">Nothing has been published yet.</h2>
      <p>Approved artifacts will appear here, with an option to unpublish them.</p>
    </section>
  {:else}
    <div class="queue">
      {#each published as artifact, index (artifact.id)}
        {@const hero = artifact.images.find((image) => image.previewUrl && image.eligible)}
        <article
          class="review-row published-row"
          in:fly={{ y: 12, duration: 220 }}
          out:fly={{ y: -8, duration: 180 }}
        >
          <div class="artwork">
            {#if hero}<img
                src={hero.previewUrl ?? ''}
                alt="Processed view of {artifact.title}"
                loading="lazy"
              />{:else}<div class="no-artwork"><span>Image preview unavailable</span></div>{/if}
            <span class="image-count">Published</span>
          </div>
          <div class="record">
            <p class="eyebrow">Collection item {String(index + 1).padStart(2, '0')}</p>
            <h2 class="editorial-title">{artifact.title}</h2>
            <p class="origin">
              {artifact.origin ?? 'Origin not recorded'} <span>·</span>
              {artifact.date_display ?? artifact.historical_period ?? 'Period not recorded'}
            </p>
            <div class="row-actions published-actions">
              <a
                class="preview-link"
                href="/artifacts/{artifact.slug}"
                target="_blank"
                rel="noreferrer">View public record ↗</a
              >
              <form method="POST" action="?/unpublish" use:enhance>
                <input type="hidden" name="artifactId" value={artifact.id} />
                <label class="note-field"
                  >Moderator note <input
                    name="note"
                    maxlength="1000"
                    placeholder="Optional"
                  /></label
                >
                <button class="unpublish" type="submit">Unpublish</button>
              </form>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</main>

<style>
  .moderation {
    padding-block: clamp(3rem, 7vw, 6.5rem) 8rem;
  }
  .page-heading {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 2rem;
    padding-bottom: 2.6rem;
    border-bottom: 1px solid var(--color-line);
  }
  .page-heading h1 {
    max-width: 13ch;
    margin: 0.2rem 0 0.7rem;
    font-size: clamp(3.2rem, 7vw, 6rem);
    line-height: 0.88;
  }
  .intro {
    max-width: 36rem;
    color: var(--color-muted);
    line-height: 1.7;
  }
  .desk-note {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: 14rem;
    color: var(--color-muted);
    font-size: 0.78rem;
    line-height: 1.5;
  }
  .desk-note span {
    display: grid;
    width: 2.2rem;
    height: 2.2rem;
    place-items: center;
    border: 1px solid var(--color-line);
    border-radius: 50%;
    color: var(--color-bronze);
  }
  .overview {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr;
    align-items: center;
    padding: 1.3rem 0 1.8rem;
    border-bottom: 1px solid var(--color-line);
  }
  .overview > div {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--color-muted);
    font-size: 0.8rem;
  }
  .count {
    color: var(--color-ink);
    font-family: var(--font-serif);
    font-size: 2rem;
  }
  .overview > p {
    justify-self: end;
    max-width: 23rem;
    margin: 0;
    color: var(--color-muted);
    font-size: 0.78rem;
    line-height: 1.6;
  }
  .views {
    display: flex;
    gap: 2rem;
    margin: 2rem 0 0;
    border-bottom: 1px solid var(--color-line);
  }
  .views button {
    position: relative;
    display: flex;
    gap: 0.6rem;
    align-items: center;
    padding: 0 0 1rem;
    border: 0;
    background: none;
    color: var(--color-muted);
    cursor: pointer;
  }
  .views button.active {
    color: var(--color-ink);
  }
  .views button.active::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 2px;
    background: var(--color-bronze);
    content: '';
  }
  .views button span {
    display: grid;
    min-width: 1.4rem;
    height: 1.4rem;
    place-items: center;
    border-radius: 50%;
    background: #e9e1d6;
    font-size: 0.7rem;
  }
  .notice {
    margin: 1.25rem 0;
    padding: 0.8rem 1rem;
    border-left: 2px solid #9a5942;
    background: #f3e9e2;
    color: #683c30;
  }
  .notice.success {
    border-color: #526c53;
    background: #e9eee5;
    color: #344b36;
  }
  .queue {
    margin-top: 0.2rem;
  }
  .review-row {
    display: grid;
    grid-template-columns: minmax(13rem, 0.72fr) minmax(0, 1.6fr);
    gap: clamp(1.5rem, 4vw, 4rem);
    padding: 2.3rem 0;
    border-bottom: 1px solid var(--color-line);
  }
  .artwork {
    position: relative;
    display: grid;
    min-height: 17rem;
    aspect-ratio: 4/3;
    place-items: center;
    overflow: hidden;
    background: #e7dfd3;
  }
  .artwork img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    mix-blend-mode: multiply;
  }
  .no-artwork {
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
    color: var(--color-muted);
    font-family: var(--font-serif);
    font-size: 1.25rem;
  }
  .image-count {
    position: absolute;
    right: 0.7rem;
    bottom: 0.7rem;
    padding: 0.35rem 0.55rem;
    background: var(--color-paper);
    color: var(--color-muted);
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .record {
    min-width: 0;
  }
  .record > .eyebrow {
    margin: 0 0 0.55rem;
  }
  .record h2 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3.5rem);
    line-height: 0.96;
  }
  .origin {
    margin: 0.65rem 0 1.4rem;
    color: var(--color-muted);
    font-size: 0.86rem;
  }
  .origin span,
  .rights-line p span {
    color: var(--color-bronze);
  }
  .metadata {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    padding-top: 1.1rem;
    border-top: 1px solid var(--color-line);
  }
  .metadata h3 {
    margin: 0 0 0.75rem;
    color: var(--color-muted);
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .source-line {
    display: grid;
    gap: 0.25rem;
    margin-bottom: 0.7rem;
    font-size: 0.78rem;
  }
  .source-line a,
  .rights-line a,
  .preview-link {
    color: var(--color-bronze);
    font-size: 0.75rem;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .source-line p,
  .rights-line small {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.72rem;
    line-height: 1.5;
  }
  .muted {
    color: var(--color-muted);
    font-size: 0.78rem;
  }
  .image-rights {
    display: grid;
    gap: 0.7rem;
  }
  .rights-line {
    display: flex;
    gap: 0.55rem;
    align-items: start;
  }
  .rights-line p {
    margin: 0 0 0.2rem;
    font-size: 0.75rem;
  }
  .rights-dot {
    flex: 0 0 auto;
    width: 0.45rem;
    height: 0.45rem;
    margin-top: 0.25rem;
    border-radius: 50%;
    background: #aa6349;
  }
  .rights-dot.eligible {
    background: #5a785a;
  }
  .rights-line small {
    display: block;
    margin-top: 0.15rem;
  }
  .row-actions {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  .row-actions form {
    display: flex;
    align-items: end;
    gap: 0.8rem;
  }
  .note-field {
    display: grid;
    gap: 0.35rem;
    color: var(--color-muted);
    font-size: 0.65rem;
  }
  .note-field input {
    width: min(15rem, 30vw);
    padding: 0.55rem 0.65rem;
    border: 1px solid var(--color-line);
    border-radius: 0;
    background: transparent;
    font-size: 0.78rem;
  }
  .row-actions button {
    padding: 0.7rem 1rem;
    border: 0;
    background: #35483f;
    color: #fffdf8;
    cursor: pointer;
    font-size: 0.75rem;
  }
  .row-actions button span {
    margin-left: 0.5rem;
    color: #d9b69f;
  }
  .row-actions button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .row-actions button.unpublish {
    background: transparent;
    border: 1px solid #9a5942;
    color: #754532;
  }
  .hint {
    margin: 0.65rem 0 0;
    color: #8d4a36;
    font-size: 0.75rem;
  }
  .empty-state {
    padding: 5rem 1rem;
    text-align: center;
  }
  .empty-state h2 {
    margin: 0.5rem 0;
    font-size: clamp(2rem, 5vw, 3.5rem);
  }
  .empty-state > p:last-child {
    color: var(--color-muted);
  }
  @media (max-width: 750px) {
    .page-heading {
      align-items: start;
      flex-direction: column;
      gap: 0.8rem;
    }
    .desk-note {
      max-width: none;
      margin: 0;
    }
    .overview {
      grid-template-columns: 1fr 1fr;
      gap: 0.8rem;
    }
    .overview > p {
      grid-column: 1/-1;
      justify-self: start;
      margin-top: 0.4rem;
    }
    .review-row {
      grid-template-columns: 1fr;
      gap: 1.4rem;
    }
    .artwork {
      min-height: 0;
      aspect-ratio: 16/10;
    }
  }
  @media (max-width: 500px) {
    .metadata {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    .row-actions,
    .row-actions form {
      align-items: stretch;
      flex-direction: column;
    }
    .row-actions form {
      width: 100%;
    }
    .note-field input {
      width: 100%;
    }
  }
</style>
