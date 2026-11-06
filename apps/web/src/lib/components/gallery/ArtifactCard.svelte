<script lang="ts">
  import type { ArtifactCardView } from '@culturio/db';
  let {
    artifact,
    eager = false,
    onopen
  }: {
    artifact: ArtifactCardView;
    eager?: boolean;
    onopen?: (event: MouseEvent, artifact: ArtifactCardView) => void;
  } = $props();
  let loaded = $state(false);
</script>

<article
  class="group"
  data-ratio={artifact.image ? artifact.image.height / artifact.image.width : 1.15}
>
  <a
    id={`artifact-${artifact.id}`}
    href={`/artifacts/${artifact.slug}`}
    onclick={(event) => onopen?.(event, artifact)}
    aria-label={`View ${artifact.title}`}
  >
    <div
      class="image"
      style:background={artifact.image?.dominantColor ?? '#d8cabb'}
      style:aspect-ratio={artifact.image
        ? `${artifact.image.width}/${artifact.image.height}`
        : '4/5'}
    >
      {#if artifact.image}<img
          class:loaded
          src={artifact.image.src}
          srcset={artifact.image.srcset || undefined}
          sizes="(max-width: 420px) 92vw, (max-width: 700px) 46vw, (max-width: 1024px) 31vw, (max-width: 1400px) 23vw, 16vw"
          width={artifact.image.width}
          height={artifact.image.height}
          alt={artifact.image.alt}
          loading={eager ? 'eager' : 'lazy'}
          fetchpriority={eager ? 'high' : 'auto'}
          decoding="async"
          onload={() => (loaded = true)}
        />{:else}<div class="unavailable">Image unavailable</div>{/if}
      <div class="overlay">
        <span>{artifact.period ?? artifact.origin ?? 'View artifact'}</span>
      </div>
    </div>
    <div class="meta">
      <h2>{artifact.title}</h2>
      {#if artifact.culture || artifact.civilization}<p>
          {artifact.culture ?? artifact.civilization}
        </p>{/if}
    </div>
  </a>
</article>

<style>
  article {
    min-width: 0;
  }
  a {
    display: block;
    border-radius: 0.4rem;
  }
  .image {
    position: relative;
    overflow: hidden;
    border-radius: 0.4rem;
    isolation: isolate;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    transition:
      opacity 0.35s ease,
      transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  img.loaded {
    opacity: 1;
  }
  .overlay {
    position: absolute;
    inset: auto 0.6rem 0.6rem;
    display: flex;
    align-items: end;
    min-height: 35%;
    padding: 0.65rem;
    border-radius: 0.25rem;
    background: linear-gradient(transparent, rgba(20, 15, 12, 0.76));
    color: white;
    opacity: 0;
    transform: translateY(0.3rem);
    transition: 0.25s;
  }
  .overlay span {
    align-self: end;
    font-size: 0.75rem;
  }
  .meta {
    padding: 0.65rem 0.15rem 0.25rem;
  }
  .meta h2 {
    font-family: var(--font-serif);
    font-size: 1.18rem;
    line-height: 1.05;
    font-weight: 600;
  }
  .meta p {
    margin-top: 0.22rem;
    color: var(--color-muted);
    font-size: 0.78rem;
  }
  .unavailable {
    display: grid;
    height: 100%;
    place-items: center;
    color: #574b40;
    font-size: 0.78rem;
  }
  @media (hover: hover) {
    a:hover img {
      transform: scale(1.025);
    }
    a:hover .overlay {
      opacity: 1;
      transform: none;
    }
  }
  @media (max-width: 700px) {
    .overlay {
      display: none;
    }
    .meta h2 {
      font-size: 1rem;
    }
    .meta {
      padding-top: 0.5rem;
    }
  }
</style>
