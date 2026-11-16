<footer>
  <div class="page-shell footer-main">
    <div class="identity">
      <a class="wordmark editorial-title" href="/">Culturio</a>
      <p>An open archive for discovering African cultural heritage through its artifacts.</p>
    </div>
    <nav aria-label="Footer">
      <a href="/gallery">Explore the archive</a>
      <a href="/search">Search</a>
      <a href="/museum">Virtual museum</a>
      <a href="/about">About Culturio</a>
      <a
        class="github-link"
        href="https://github.com/a1s0sa/culturio"
        aria-label="Culturio on GitHub"
        title="Culturio on GitHub"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.7 2.61 1.21 3.25.93.1-.72.39-1.21.71-1.49-2.48-.28-5.08-1.24-5.08-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.67.11 2.95.72.78 1.15 1.77 1.15 2.99 0 4.29-2.6 5.23-5.09 5.51.4.35.76 1.03.76 2.08v3.09c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"
          />
        </svg>
      </a>
    </nav>
  </div>
  <div class="page-shell footer-meta">
    <span>© {new Date().getFullYear()} Culturio</span>
    <span>Artifact records retain their source and attribution.</span>
  </div>
</footer>

<style>
  footer {
    border-top: 1px solid var(--color-line);
    background: var(--color-paper);
  }
  .footer-main {
    display: flex;
    justify-content: space-between;
    gap: 3rem;
    padding-block: 3rem;
  }
  .identity {
    max-width: 24rem;
  }
  .wordmark {
    font-size: 2rem;
  }
  .identity p {
    margin: 0.5rem 0 0;
    color: var(--color-muted);
    font-size: 0.9rem;
    line-height: 1.6;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    align-content: start;
    justify-content: flex-end;
    gap: 0.7rem 1.4rem;
    padding-top: 0.65rem;
  }
  nav a,
  .footer-meta {
    font-size: 0.8rem;
  }
  nav a:hover {
    color: var(--color-bronze);
  }
  nav .github-link {
    display: grid;
    width: 2rem;
    height: 2rem;
    place-items: center;
    padding: 0;
    border: 1px solid var(--color-line);
    border-radius: 50%;
  }
  .github-link svg {
    width: 1.1rem;
    height: 1.1rem;
  }
  nav .github-link:hover {
    border-color: var(--color-bronze);
    background: #e9e2d8;
  }
  .footer-meta {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-block: 1rem;
    border-top: 1px solid var(--color-line);
    color: var(--color-muted);
  }
  @media (max-width: 600px) {
    .footer-main,
    .footer-meta {
      flex-direction: column;
    }
    .footer-main {
      gap: 1.5rem;
    }
    nav {
      justify-content: flex-start;
      gap: 0.85rem 1rem;
    }
  }
</style>
