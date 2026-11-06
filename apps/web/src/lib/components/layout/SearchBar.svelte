<script lang="ts">
  import { page } from '$app/state';
  let { compact = false }: { compact?: boolean } = $props();
  let value = $state('');
  $effect(() => {
    value = page.url.searchParams.get('q') ?? '';
  });
</script>

<form action="/gallery" role="search" class:compact>
  <label class="sr-only" for={compact ? 'header-search-compact' : 'header-search'}
    >Search the archive</label
  >
  <svg aria-hidden="true" viewBox="0 0 24 24"
    ><path d="m21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg
  >
  <input
    id={compact ? 'header-search-compact' : 'header-search'}
    name="q"
    bind:value
    placeholder="Search artifacts, cultures, places…"
    autocomplete="off"
  />
</form>

<style>
  form {
    position: relative;
    display: flex;
    align-items: center;
    width: min(38rem, 45vw);
  }
  svg {
    position: absolute;
    left: 1rem;
    width: 1.05rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    color: var(--color-muted);
    pointer-events: none;
  }
  input {
    width: 100%;
    border: 1px solid transparent;
    border-radius: 999px;
    background: #e9e2d8;
    padding: 0.72rem 1rem 0.72rem 2.75rem;
    color: var(--color-ink);
    transition:
      background 0.2s,
      border-color 0.2s;
  }
  input:focus {
    background: var(--color-paper);
    border-color: var(--color-line);
  }
  @media (max-width: 700px) {
    form {
      width: 100%;
    }
    .compact input {
      padding-block: 0.62rem;
    }
  }
</style>
