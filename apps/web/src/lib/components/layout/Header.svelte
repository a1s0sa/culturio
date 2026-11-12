<script lang="ts">
  import SearchBar from './SearchBar.svelte';
  import { page } from '$app/state';
  import type { LayoutData } from '../../../routes/$types';
  let { user }: { user: NonNullable<LayoutData['user']> | null } = $props();
  let searchOpen = $state(false);
  let returnTo = $derived(
    page.url.pathname === '/sign-in' ? '/gallery' : page.url.pathname + page.url.search
  );

  async function signOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    window.location.assign('/gallery');
  }
</script>

<header>
  <div class="page-shell bar">
    <a class="wordmark editorial-title" href="/" aria-label="Culturio home">Culturio</a>
    <nav aria-label="Primary">
      <a href="/gallery">Explore</a><a href="/museum">Museum</a><a href="/about">About</a>
    </nav>
    <div class="desktop-search"><SearchBar /></div>
    <button
      class="search-toggle"
      type="button"
      aria-label={searchOpen ? 'Close search' : 'Open search'}
      aria-expanded={searchOpen}
      aria-controls="mobile-search"
      onclick={() => (searchOpen = !searchOpen)}
    >
      {#if searchOpen}
        <span aria-hidden="true">×</span>
      {:else}
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
        </svg>
      {/if}
    </button>
    {#if user}
      <details class="account">
        <summary aria-label="Account menu"
          ><img src={user.avatar} alt="" /> <span>{user.name || user.email}</span></summary
        >
        <div class="menu">
          <p class="identity" title={user.email}>{user.email}</p>
          <button type="button" onclick={signOut}>Sign out</button>
        </div>
      </details>
    {:else}
      <a class="sign-in" href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</a>
    {/if}
  </div>
  {#if searchOpen}
    <div class="mobile-search" id="mobile-search"><SearchBar /></div>
  {/if}
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
  .desktop-search {
    margin-left: auto;
  }
  .desktop-search :global(form) {
    margin-left: auto;
  }
  .search-toggle,
  .mobile-search {
    display: none;
  }
  .sign-in {
    padding: 0.55rem 0.85rem;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    font-size: 0.9rem;
  }
  .account {
    position: relative;
  }
  .account summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    list-style: none;
  }
  .account summary::-webkit-details-marker {
    display: none;
  }
  .account img {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 1px solid var(--color-line);
  }
  .menu {
    position: absolute;
    right: 0;
    top: calc(100% + 0.6rem);
    min-width: 9rem;
    padding: 0.35rem;
    background: var(--color-paper);
    border: 1px solid var(--color-line);
    box-shadow: 0 8px 24px #211d1920;
  }
  .identity {
    max-width: 16rem;
    margin: 0;
    padding: 0.55rem 0.65rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-muted);
    font-size: 0.82rem;
  }
  .menu button {
    width: 100%;
    padding: 0.65rem;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }
  .menu button:hover {
    background: #e9e2d8;
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
      min-height: 3.75rem;
      padding-block: 0.45rem;
      display: flex;
      flex-wrap: nowrap;
      gap: 0.45rem;
    }
    .wordmark {
      flex: 0 0 auto;
      font-size: 1.35rem;
    }
    nav {
      flex: 1 1 auto;
      min-width: 0;
      justify-content: center;
      gap: 0;
      overflow-x: auto;
      scrollbar-width: none;
      white-space: nowrap;
    }
    nav::-webkit-scrollbar {
      display: none;
    }
    nav a {
      flex: 0 0 auto;
      padding: 0.4rem 0.3rem;
      font-size: 0.7rem;
    }
    .desktop-search {
      display: none;
    }
    .search-toggle {
      flex: 0 0 2rem;
      width: 2rem;
      height: 2rem;
      display: grid;
      place-items: center;
      padding: 0;
      border: 1px solid var(--color-line);
      border-radius: 50%;
      background: transparent;
      color: var(--color-ink);
      cursor: pointer;
      font-size: 1.35rem;
      line-height: 1;
    }
    .search-toggle svg {
      width: 1rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
    }
    .mobile-search {
      display: block;
      padding: 0.5rem 1rem 0.75rem;
      border-top: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
    }
    .mobile-search :global(form) {
      width: 100%;
    }
    .account summary {
      gap: 0;
    }
    .account summary span {
      display: none;
    }
    .account img {
      width: 2rem;
      height: 2rem;
    }
    .identity {
      max-width: min(70vw, 16rem);
    }
    .sign-in {
      padding: 0.45rem 0.55rem;
      font-size: 0.75rem;
      white-space: nowrap;
    }
  }
</style>
