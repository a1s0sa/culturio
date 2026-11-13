<script lang="ts">
  import { page } from '$app/state';
  import type { LayoutData } from '../../../routes/$types';
  let { user }: { user: NonNullable<LayoutData['user']> | null } = $props();
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
      <a href="/gallery">Explore</a><a href="/search">Search</a><a href="/museum">Museum</a><a
        href="/about">About</a
      >
    </nav>
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
  .sign-in {
    margin-left: auto;
    padding: 0.55rem 0.85rem;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    font-size: 0.9rem;
  }
  .account {
    position: relative;
    margin-left: auto;
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
      justify-content: space-between;
      gap: 0.75rem;
    }
    .wordmark {
      flex: 0 0 auto;
      font-size: 1.35rem;
    }
    nav {
      display: none;
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
      margin-left: auto;
      padding: 0.45rem 0.55rem;
      font-size: 0.75rem;
      white-space: nowrap;
    }
  }
</style>
