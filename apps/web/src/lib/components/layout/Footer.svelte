<footer>
  <div class="page-shell footer-main">
    <div class="footer-left">
      <div class="identity">
        <a class="wordmark editorial-title" href="/">Culturio</a>
        <p>An open archive for discovering African cultural heritage through its artifacts.</p>
      </div>
      <nav aria-label="Footer">
        <a href="/gallery">Gallery</a>
        <a href="/search">Search</a>
        <a href="/museum">Museum</a>
        <a href="/about">About</a>
      </nav>
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
            d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
          />
        </svg>
      </a>
      <p class="artifact-note">Artifact records retain their source and attribution.</p>
    </div>

    <div class="footer-right">
      <p class="footer-credit">
        <span>curated by</span>
        <a
          class="aibergo-link"
          href="https://x.com/aibergolabs"
          aria-label="Aibergo Labs on X"
          title="Aibergo Labs on X"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img class="logo-dark" src="/AIBERGO_LABS_DARK_BLUE.png" alt="" />
          <img class="logo-light" src="/AIBERGO_LABS_LIGHT_BLUE.png" alt="" />
        </a>
      </p>
    </div>
  </div>

  <div class="footer-art" aria-hidden="true">
    <img src="/CULTURIO-OPEN%20GRAPH%202.jpg" alt="" />
  </div>
</footer>

<style>
  footer {
    overflow: hidden;
    background: var(--color-ivory);
  }
  .footer-main {
    display: flex;
    justify-content: space-between;
    gap: 3rem;
    width: 75%;
    padding-block: 2.5rem 2rem;
    color: var(--color-ink);
  }
  .footer-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .identity {
    max-width: 24rem;
  }
  .wordmark {
    font-size: 2rem;
  }
  .identity p {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    line-height: 1.6;
  }
  nav {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.7rem;
    margin-top: 1.7rem;
  }
  nav a {
    font-size: 0.88rem;
  }
  nav a:hover {
    color: var(--color-bronze);
  }
  .github-link {
    display: inline-flex;
    margin-top: 1.1rem;
    color: #b8aa96;
    transition: color 160ms ease;
  }
  .github-link:hover {
    color: var(--color-bronze);
  }
  .github-link svg {
    width: 1.3rem;
    height: 1.3rem;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.7;
  }
  .artifact-note {
    margin: 1.6rem 0 0;
    font-size: 0.76rem;
  }
  .footer-right {
    display: flex;
    flex-direction: row;
    align-items: center;
    align-self: flex-end;
    gap: 0.75rem;
    padding-top: 0.3rem;
    color: var(--color-ink);
  }
  .footer-right p {
    margin: 0;
    font-size: 0.85rem;
  }
  .footer-credit {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .aibergo-link {
    position: relative;
    display: inline-block;
    flex: none;
    width: 6.45rem;
    height: 2rem;
  }
  .aibergo-link img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: opacity 160ms ease;
  }
  .aibergo-link .logo-dark {
    opacity: 1;
  }
  .aibergo-link .logo-light {
    opacity: 0;
  }
  .aibergo-link:hover .logo-dark,
  .aibergo-link:focus-visible .logo-dark {
    opacity: 0;
  }
  .aibergo-link:hover .logo-light,
  .aibergo-link:focus-visible .logo-light {
    opacity: 1;
  }
  .footer-art {
    position: relative;
    height: clamp(25rem, 30vw, 38rem);
    overflow: hidden;
    background: var(--color-ivory);
  }
  .footer-art img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    transform: scale(1.16);
    -webkit-mask-image: linear-gradient(to bottom, #000 78%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 78%, transparent 100%);
  }
  @media (prefers-reduced-motion: reduce) {
    .aibergo-link img {
      transition: none;
    }
  }
  @media (max-width: 600px) {
    .footer-main {
      flex-direction: column;
      gap: 2.5rem;
      width: calc(100% - 2rem);
      padding-block: 3rem 2rem;
    }
    .footer-right {
      align-self: flex-start;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .footer-art {
      margin-top: 1.5rem;
      height: 55vw;
      min-height: 10rem;
      max-height: 22rem;
    }
    .footer-art img {
      transform: scale(1.02) translateY(20%);
    }
  }
</style>
