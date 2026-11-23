<script lang="ts">
  import { page } from '$app/state';
  import type { LayoutData } from '../../../routes/$types';
  let { user, authEnabled }: Pick<LayoutData, 'user' | 'authEnabled'> = $props();
  let returnTo = $derived(
    page.url.pathname === '/sign-in' ? '/gallery' : page.url.pathname + page.url.search
  );

  async function signOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    window.location.assign('/gallery');
  }
</script>

<aside class="side-rail" aria-label="Main navigation">
  <a class="brand-mark" href="/" aria-label="Culturio home">
    <img src="/CULTURIO-INITIAL.jpg" alt="" />
  </a>
  <nav aria-label="Primary">
    <a
      href="/gallery"
      aria-label="Explore the archive"
      aria-current={page.url.pathname === '/gallery' ? 'page' : undefined}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"
        ><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect
          x="13.5"
          y="3.5"
          width="7"
          height="7"
          rx="1.5"
        /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect
          x="13.5"
          y="13.5"
          width="7"
          height="7"
          rx="1.5"
        /></svg
      >
      <span>Explore</span>
    </a>
    <a
      href="/search"
      aria-label="Search the archive"
      aria-current={page.url.pathname === '/search' ? 'page' : undefined}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"
        ><circle cx="10.8" cy="10.8" r="7.2" /><path d="m16.2 16.2 4.3 4.3" /></svg
      >
      <span>Search</span>
    </a>
    <a
      href="/museum"
      aria-label="Visit the museum"
      aria-current={page.url.pathname === '/museum' ? 'page' : undefined}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"
        ><path d="M3 9.5 12 4l9 5.5M5 10v9m4-9v9m6-9v9m4-9v9M3 20h18" /></svg
      >
      <span>Museum</span>
    </a>
  </nav>
  <a
    class="about-link"
    href="/about"
    aria-label="About Culturio"
    aria-current={page.url.pathname === '/about' ? 'page' : undefined}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true"
      ><circle cx="12" cy="12" r="9" /><path
        d="M9.6 9a2.5 2.5 0 1 1 4.7 1.2c-.8 1.1-2.3 1.3-2.3 3M12 17h.01"
      /></svg
    >
    <span>About</span>
  </a>
</aside>

<header class="topbar">
  {#if user}
    <details class="account">
      <summary aria-label="Open profile menu">
        <img src={user.avatar} alt="" />
        <span>{user.name || user.email}</span>
        <svg class="chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
      </summary>
      <div class="menu">
        <p class="identity" title={user.email}>{user.email}</p>
        {#if user.role === 'moderator'}<a href="/moderation">Moderation</a>{/if}
        <button type="button" onclick={signOut}>Sign out</button>
      </div>
    </details>
  {:else if authEnabled}
    <a class="sign-in" href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</a>
  {/if}
</header>

<style>
  .side-rail {
    position: fixed;
    z-index: 50;
    inset: 0 auto 0 0;
    display: flex;
    width: 5.25rem;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 1.15rem 0.55rem;
    border-right: 1px solid var(--color-line);
    background: var(--color-paper);
  }
  .brand-mark {
    position: relative;
    overflow: hidden;
    display: grid;
    width: 2.55rem;
    aspect-ratio: 1;
    place-items: center;
    border-radius: 50%;
    background: var(--color-ivory);
  }
  .brand-mark img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(3);
  }
  nav {
    display: grid;
    width: 100%;
    gap: 0.65rem;
  }
  nav a,
  .about-link {
    display: grid;
    min-height: 3.7rem;
    place-items: center;
    gap: 0.15rem;
    border-radius: 1rem;
    color: var(--color-muted);
    font-size: 0.62rem;
    font-weight: 500;
    transition:
      background 160ms ease,
      color 160ms ease;
  }
  nav a:hover,
  .about-link:hover,
  nav a[aria-current='page'],
  .about-link[aria-current='page'] {
    background: #eee6db;
    color: var(--color-ink);
  }
  nav svg,
  .about-link svg {
    width: 1.45rem;
    height: 1.45rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .about-link {
    margin-top: auto;
    width: 100%;
  }
  .topbar {
    position: fixed;
    z-index: 45;
    inset: 0 0 auto 5.25rem;
    display: flex;
    height: 4.65rem;
    align-items: center;
    justify-content: flex-end;
    padding: 0.7rem clamp(1rem, 3vw, 2.8rem);
    border-bottom: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
    background: color-mix(in srgb, var(--color-ivory) 92%, transparent);
    backdrop-filter: blur(16px);
  }
  .account {
    position: relative;
    flex: 0 0 auto;
  }
  .account summary {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    max-width: 14rem;
    cursor: pointer;
    list-style: none;
  }
  .account summary::-webkit-details-marker {
    display: none;
  }
  .account summary img {
    width: 2.35rem;
    height: 2.35rem;
    border: 1px solid var(--color-line);
    border-radius: 50%;
  }
  .account summary span {
    overflow: hidden;
    max-width: 9rem;
    font-size: 0.8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chevron {
    width: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }
  .sign-in {
    margin-left: auto;
    padding: 0.65rem 1rem;
    border-radius: 999px;
    background: var(--color-ink);
    color: var(--color-paper);
    font-size: 0.82rem;
  }
  .menu {
    position: absolute;
    top: calc(100% + 0.65rem);
    right: 0;
    min-width: 12rem;
    padding: 0.4rem;
    border: 1px solid var(--color-line);
    border-radius: 1rem;
    background: var(--color-paper);
    box-shadow: 0 12px 32px #211d1920;
  }
  .identity,
  .menu a,
  .menu button {
    display: block;
    width: 100%;
    margin: 0;
    padding: 0.7rem;
    overflow: hidden;
    border: 0;
    border-radius: 0.65rem;
    background: transparent;
    color: var(--color-ink);
    font-size: 0.8rem;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .identity {
    color: var(--color-muted);
  }
  .menu a:hover,
  .menu button:hover {
    background: #eee6db;
  }
  .menu button {
    cursor: pointer;
  }
  @media (max-width: 700px) {
    .side-rail {
      display: none;
    }
    .topbar {
      inset-inline: 0;
      height: 4.15rem;
      padding: 0.45rem 0.8rem;
      gap: 0.6rem;
    }
    .account summary span,
    .chevron {
      display: none;
    }
    .account summary img {
      width: 2.2rem;
      height: 2.2rem;
    }
  }
</style>
