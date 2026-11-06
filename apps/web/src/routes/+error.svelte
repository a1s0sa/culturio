<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head
  ><title>{page.status === 404 ? 'Not found' : 'Something went wrong'} — Culturio</title
  ></svelte:head
>
<main class="page-shell">
  <p class="eyebrow">Error {page.status}</p>
  <h1 class="editorial-title">
    {page.status === 404
      ? 'This artifact could not be found.'
      : 'The archive could not answer this request.'}
  </h1>
  <p>{page.error?.message}</p>
  <a href="/gallery">Return to the gallery</a>
</main>

<style>
  main {
    min-height: 70vh;
    display: grid;
    align-content: center;
    max-width: 55rem;
  }
  h1 {
    font-size: clamp(3.5rem, 9vw, 7rem);
    line-height: 0.85;
    margin: 0.5rem 0 1rem;
  }
  p {
    color: var(--color-muted);
  }
  a {
    text-decoration: underline;
    text-underline-offset: 4px;
    margin-top: 1rem;
  }
</style>
