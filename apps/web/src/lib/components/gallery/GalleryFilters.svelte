<script lang="ts">
  import { goto } from '$app/navigation';
  import type { ArtifactFilters } from '@culturio/db';
  import type { GalleryQuery } from '@culturio/shared';
  let { filters, query }: { filters: ArtifactFilters; query: GalleryQuery } = $props();
  let search = $state('');
  let timer: ReturnType<typeof setTimeout>;
  $effect(() => {
    search = query.q ?? '';
  });
  function navigate(form: HTMLFormElement) {
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of data) if (String(value)) params.set(key, String(value));
    goto(`/gallery?${params}`, { reset: false });
  }
  function debounce(form: HTMLFormElement) {
    clearTimeout(timer);
    timer = setTimeout(() => navigate(form), 300);
  }
  let options = $derived([
    ['culture', 'Culture', filters.cultures],
    ['country', 'Country / region', filters.countries],
    ['type', 'Artifact type', filters.types],
    ['period', 'Period', filters.periods],
    ['material', 'Material', filters.materials]
  ] as const);
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    navigate(event.currentTarget);
  }}
  onchange={(event) => navigate(event.currentTarget)}
>
  <div class="search">
    <label for="gallery-search">Search archive</label><input
      id="gallery-search"
      name="q"
      bind:value={search}
      placeholder="Benin, mask, bronze…"
      oninput={(event) => debounce(event.currentTarget.form!)}
    />
  </div>
  <div class="filters">
    {#each options as option}<label
        ><span>{option[1]}</span><select name={option[0]} value={query[option[0]] ?? ''}
          ><option value="">All</option>{#each option[2] as value}<option {value}>{value}</option
            >{/each}</select
        ></label
      >{/each}
    <label
      ><span>Sort</span><select name="sort" value={query.sort}
        ><option value="curated">Curated</option><option value="oldest">Oldest</option><option
          value="newest">Newest</option
        ><option value="recent">Recently added</option><option value="alphabetical"
          >Alphabetical</option
        ></select
      ></label
    >
    <button type="submit">Apply</button
    >{#if query.q || query.culture || query.country || query.type || query.period || query.material}<a
        href="/gallery">Clear all</a
      >{/if}
  </div>
</form>

<style>
  form {
    padding: 1.2rem 0 1rem;
    border-bottom: 1px solid var(--color-line);
  }
  .search {
    display: none;
  }
  .filters {
    display: flex;
    gap: 0.55rem;
    align-items: end;
    overflow: auto;
    padding-bottom: 0.25rem;
  }
  .filters label {
    display: grid;
    gap: 0.28rem;
    flex: 0 0 auto;
  }
  .filters span,
  .search label {
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-muted);
  }
  select,
  input {
    border: 1px solid var(--color-line);
    background: var(--color-paper);
    color: var(--color-ink);
    border-radius: 999px;
    padding: 0.55rem 0.85rem;
    max-width: 12rem;
  }
  button,
  a {
    border: 0;
    border-radius: 999px;
    padding: 0.6rem 0.9rem;
    background: var(--color-ink);
    color: white;
    font-size: 0.8rem;
  }
  a {
    background: transparent;
    color: var(--color-bronze);
  }
  @media (max-width: 700px) {
    form {
      padding-top: 0.85rem;
    }
    .search {
      display: grid;
      gap: 0.3rem;
      margin-bottom: 0.7rem;
    }
    .search input {
      max-width: none;
      width: 100%;
    }
    .filters {
      align-items: center;
    }
    .filters label span {
      display: none;
    }
    select {
      max-width: 9rem;
      padding: 0.5rem 0.72rem;
    }
  }
</style>
