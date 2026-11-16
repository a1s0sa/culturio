<script lang="ts">
  import { page } from '$app/state';
</script>

<nav aria-label="Mobile navigation">
  <a
    class="island"
    href="/"
    aria-label="Home"
    aria-current={page.url.pathname === '/' ? 'page' : undefined}
  >
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m3.5 10 8.5-7 8.5 7v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-4v6h-5A1.5 1.5 0 0 1 3.5 19z" />
    </svg>
  </a>
  <a
    class="island"
    href="/search"
    aria-label="Search"
    aria-current={page.url.pathname === '/search' ? 'page' : undefined}
  >
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="7.2" />
      <path d="m16.2 16.2 4.3 4.3" />
    </svg>
  </a>
  <a
    class="island"
    href="/gallery"
    aria-label="Gallery"
    aria-current={page.url.pathname === '/gallery' ? 'page' : undefined}
  >
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
  </a>
</nav>

<style>
  nav {
    display: none;
  }
  @media (max-width: 700px) {
    nav {
      position: fixed;
      z-index: 45;
      bottom: calc(1rem + env(safe-area-inset-bottom));
      left: 50%;
      display: flex;
      align-items: center;
      gap: 0.7rem;
      transform: translateX(-50%);
    }
    .island {
      display: grid;
      width: 3.5rem;
      height: 3.5rem;
      place-items: center;
      border: 1px solid color-mix(in srgb, var(--color-paper) 24%, transparent);
      border-radius: 1.3rem;
      background: var(--color-ink);
      color: var(--color-paper);
      box-shadow:
        0 0.7rem 1.7rem rgba(33, 29, 25, 0.2),
        0 0.15rem 0.35rem rgba(33, 29, 25, 0.16);
      cursor: pointer;
      transition:
        transform 180ms cubic-bezier(0.2, 0.7, 0.2, 1),
        box-shadow 180ms ease,
        background-color 180ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .island:hover {
      transform: translateY(-2px);
      box-shadow:
        0 0.9rem 1.9rem rgba(33, 29, 25, 0.24),
        0 0.2rem 0.4rem rgba(33, 29, 25, 0.16);
    }
    .island:active {
      transform: scale(0.94);
    }
    .island:focus-visible {
      outline: 2px solid var(--color-bronze);
      outline-offset: 3px;
    }
    svg {
      width: 1.65rem;
      height: 1.65rem;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .island {
      transition: none;
    }
  }
</style>
