<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import type { ArtifactCardView, ArtifactDetailView } from '@culturio/db';
  import ArtifactDetails from './ArtifactDetails.svelte';
  let {
    slug,
    returnFocusId,
    preview
  }: { slug: string; returnFocusId?: string; preview?: ArtifactCardView } = $props();
  let dialog: HTMLDialogElement;
  let artifact = $state<ArtifactDetailView | null>(null);
  let loading = $state(true);
  let failed = $state(false);
  onMount(() => {
    dialog.showModal();
  });
  $effect(() => {
    const controller = new AbortController();
    loading = true;
    failed = false;
    fetch(`/api/artifacts/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<ArtifactDetailView>;
      })
      .then((value) => {
        artifact = value;
        loading = false;
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          failed = true;
          loading = false;
        }
      });
    return () => controller.abort();
  });
  function close() {
    history.back();
    setTimeout(() => document.getElementById(returnFocusId ?? '')?.focus(), 0);
  }
  function openCanonical(event: MouseEvent) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    void goto(`/artifacts/${slug}`, {
      state: {
        ...page.state,
        modalSlug: undefined,
        returnFocusId: undefined,
        modalPreview: undefined
      }
    });
  }
</script>

<dialog
  bind:this={dialog}
  oncancel={(event) => {
    event.preventDefault();
    close();
  }}
  aria-label={artifact ? artifact.title : 'Artifact details'}
>
  <button class="close" type="button" onclick={close} aria-label="Close artifact details">×</button>
  <div class="body">
    {#if loading}<div class="loading" role="status" aria-label="Loading artifact details">
        {#if preview?.image}<div
            class="loading-image"
            style:background={preview.image.dominantColor}
            style:view-transition-name={page.state.transitionArtifactId === preview.id
              ? `image-${preview.id}`
              : undefined}
            style:contain={page.state.transitionArtifactId === preview.id ? 'layout' : undefined}
          >
            <img
              src={preview.image.src}
              alt=""
              width={preview.image.width}
              height={preview.image.height}
            />
          </div>{:else}<span class="loading-image"></span>{/if}
        <span class="loading-copy">
          <i></i><i></i><i></i><i></i><i></i>
        </span>
      </div>{:else if failed}<div>
        <p>We could not load this artifact.</p>
        <a href={`/artifacts/${slug}`} onclick={openCanonical}>Open its page</a>
      </div>{:else if artifact}<ArtifactDetails {artifact} compact />
      <p class="canonical">
        <a href={`/artifacts/${slug}`} onclick={openCanonical}>Open canonical artifact page →</a>
      </p>{/if}
  </div>
</dialog>

<style>
  dialog {
    width: min(94vw, 88rem);
    max-height: 92vh;
    min-height: min(60vh, 38rem);
    border: 0;
    border-radius: 0.65rem;
    padding: 0;
    background: var(--color-paper);
    color: var(--color-ink);
    box-shadow: 0 2rem 6rem rgba(25, 17, 12, 0.28);
    opacity: 0;
    transform: translateY(0.65rem) scale(0.99);
    transition:
      opacity 220ms ease,
      transform 260ms cubic-bezier(0.2, 0.7, 0.2, 1),
      overlay 220ms allow-discrete,
      display 220ms allow-discrete;
  }
  dialog[open] {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  @starting-style {
    dialog[open] {
      opacity: 0;
      transform: translateY(0.65rem) scale(0.99);
    }
  }
  dialog::backdrop {
    background: rgba(27, 21, 17, 0.72);
    backdrop-filter: blur(5px);
    transition:
      background-color 220ms ease,
      backdrop-filter 220ms ease,
      overlay 220ms allow-discrete,
      display 220ms allow-discrete;
  }
  @starting-style {
    dialog[open]::backdrop {
      background: rgba(27, 21, 17, 0);
      backdrop-filter: blur(0);
    }
  }
  .body {
    padding: clamp(1.2rem, 3vw, 3rem);
    overflow: auto;
    max-height: 92vh;
  }
  .loading {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(15rem, 0.85fr);
    gap: clamp(1.5rem, 4vw, 3rem);
    min-height: min(60vh, 38rem);
  }
  .loading-image,
  .loading-copy i {
    display: block;
    border-radius: 0.35rem;
    background: #e8dfd2;
    animation: loading-pulse 1.4s ease-in-out infinite alternate;
  }
  .loading-image {
    display: grid;
    width: 100%;
    min-height: min(55vh, 34rem);
    place-items: center;
    overflow: hidden;
  }
  .loading-image img {
    display: block;
    width: 100%;
    max-height: min(55vh, 34rem);
    object-fit: contain;
  }
  .loading-copy {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding-top: 1rem;
  }
  .loading-copy i {
    height: 0.85rem;
  }
  .loading-copy i:first-child {
    width: 35%;
    height: 0.55rem;
    margin-bottom: 0.7rem;
  }
  .loading-copy i:nth-child(2) {
    width: 78%;
    height: 3rem;
    margin-bottom: 0.6rem;
  }
  .loading-copy i:nth-child(4) {
    width: 86%;
  }
  .loading-copy i:nth-child(5) {
    width: 58%;
  }
  @keyframes loading-pulse {
    to {
      opacity: 0.55;
    }
  }
  .close {
    position: sticky;
    z-index: 3;
    float: right;
    top: 1rem;
    margin: 1rem 1rem -4rem 0;
    width: 2.7rem;
    height: 2.7rem;
    border: 0;
    border-radius: 50%;
    background: var(--color-ink);
    color: white;
    font-size: 1.7rem;
    line-height: 1;
  }
  .canonical {
    text-align: right;
    margin: 2rem 0 0;
  }
  .canonical a {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  @media (max-width: 800px) {
    dialog {
      display: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .loading-image,
    .loading-copy i {
      animation: none;
    }
  }
</style>
