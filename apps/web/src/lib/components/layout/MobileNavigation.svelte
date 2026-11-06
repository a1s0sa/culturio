<nav aria-label="Mobile navigation">
  <a href="/gallery"><span aria-hidden="true">⌂</span>Explore</a><a href="/gallery?focus=search"
    ><span aria-hidden="true">⌕</span>Search</a
  ><a href="/museum"><span aria-hidden="true">◇</span>Museum</a>
</nav>

<style>
  nav {
    display: none;
  }
  @media (max-width: 700px) {
    nav {
      position: fixed;
      z-index: 45;
      bottom: 0;
      left: 0;
      right: 0;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      padding: 0.45rem 1rem calc(0.45rem + env(safe-area-inset-bottom));
      border-top: 1px solid var(--color-line);
      background: color-mix(in srgb, var(--color-paper) 95%, transparent);
      backdrop-filter: blur(16px);
    }
    a {
      display: grid;
      justify-items: center;
      gap: 0.12rem;
      padding: 0.3rem;
      font-size: 0.68rem;
      color: var(--color-muted);
    }
    span {
      font-size: 1.25rem;
      color: var(--color-ink);
    }
  }
</style>
