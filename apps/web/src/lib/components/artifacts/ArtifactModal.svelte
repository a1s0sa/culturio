<script lang="ts">
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { tick } from 'svelte';
  import type { ArtifactDetailView } from '@culturio/db';
  import ArtifactDetails from './ArtifactDetails.svelte';
  let { slug, returnFocusId }: { slug: string; returnFocusId?: string } = $props();
  let dialog: HTMLDialogElement;
  let artifact = $state<ArtifactDetailView | null>(null);
  let loading = $state(true);
  let failed = $state(false);
  $effect(() => {
    const controller = new AbortController();
    loading = true;
    failed = false;
    fetch(`/api/artifacts/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<ArtifactDetailView>;
      })
      .then(async (value) => {
        artifact = value;
        loading = false;
        await tick();
        dialog?.showModal();
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
</script>

<dialog
  bind:this={dialog}
  out:fade={{ duration: 180 }}
  onclose={close}
  aria-label={artifact ? artifact.title : 'Artifact details'}
>
  <button
    class="close"
    type="button"
    onclick={() => dialog.close()}
    aria-label="Close artifact details">×</button
  >
  <div class="body">
    {#if loading}<p role="status">Loading artifact…</p>{:else if failed}<div>
        <p>We could not load this artifact.</p>
        <a href={`/artifacts/${slug}`}>Open its page</a>
      </div>{:else if artifact}<ArtifactDetails {artifact} compact />
      <p class="canonical">
        <a
          href={`/artifacts/${slug}`}
          onclick={(event) => {
            event.preventDefault();
            goto(`/artifacts/${slug}`);
          }}>Open canonical artifact page →</a
        >
      </p>{/if}
  </div>
</dialog>

<style>
  dialog {
    width: min(94vw, 88rem);
    max-height: 92vh;
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
</style>
