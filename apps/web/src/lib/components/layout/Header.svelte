<script lang="ts">
  import SearchBar from './SearchBar.svelte';
</script>

<header>
  <div class="page-shell bar">
    <a class="wordmark editorial-title" href="/" aria-label="Culturio home">Culturio</a>
    <nav aria-label="Primary">
      <a href="/gallery">Explore</a><a href="/museum">Museum</a><a href="/about">About</a>
    </nav>
    <SearchBar />
  </div>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 40;
    border-bottom: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
    background: color-mix(in srgb, var(--color-ivory) 92%, transparent);
    backdrop-filter: blur(16px);
  }
  .bar {
    height: 4.25rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  .wordmark {
    font-size: 1.75rem;
    font-weight: 600;
  }
  .bar :global(form) {
    margin-left: auto;
  }
  nav {
    display: flex;
    gap: 0.3rem;
  }
  nav a {
    padding: 0.55rem 0.75rem;
    border-radius: 999px;
    font-size: 0.9rem;
  }
  nav a:hover {
    background: #e9e2d8;
  }
  @media (max-width: 700px) {
    .bar {
      height: auto;
      min-height: 4rem;
      padding: 0.65rem 0;
      display: grid;
      grid-template-columns: auto 1fr;
    }
    .wordmark {
      font-size: 1.55rem;
    }
    .bar :global(form) {
      grid-column: 1/-1;
      margin: 0;
    }
    nav {
      display: none;
    }
  }
</style>
