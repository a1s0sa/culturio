<script lang="ts">
  import type { ArtifactImageView } from '@culturio/db';
  let { images, title }: { images: ArtifactImageView[]; title: string } = $props();
  let active = $state(0);
</script>

{#if images.length}<section aria-label={`${title} images`} class="viewer">
    <div class="main" style:background={images[active]?.dominantColor}>
      <img
        src={images[active]?.src}
        srcset={images[active]?.srcset || undefined}
        sizes="(max-width: 800px) 100vw, 60vw"
        width={images[active]?.width}
        height={images[active]?.height}
        alt={images[active]?.alt}
        fetchpriority="high"
      />
    </div>
    {#if images.length > 1}<div class="thumbs" role="list">
        {#each images as image, index}<button
            type="button"
            class:active={index === active}
            onclick={() => (active = index)}
            aria-label={`Show image ${index + 1}`}
            ><img src={image.src} alt="" width="72" height="72" loading="lazy" /></button
          >{/each}
      </div>{/if}
  </section>{:else}<div class="missing">
    No redistributable image is available for this artifact.
  </div>{/if}

<style>
  .viewer {
    display: grid;
    gap: 0.75rem;
  }
  .main {
    display: grid;
    place-items: center;
    min-height: 20rem;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  .main img {
    display: block;
    width: 100%;
    max-height: min(75vh, 58rem);
    object-fit: contain;
  }
  .thumbs {
    display: flex;
    gap: 0.5rem;
    overflow: auto;
  }
  .thumbs button {
    border: 2px solid transparent;
    border-radius: 0.3rem;
    padding: 0;
    background: none;
  }
  .thumbs button.active {
    border-color: var(--color-bronze);
  }
  .thumbs img {
    display: block;
    width: 3.5rem;
    height: 3.5rem;
    object-fit: cover;
  }
  .missing {
    display: grid;
    min-height: 24rem;
    place-items: center;
    background: #ddd2c3;
    color: var(--color-muted);
    padding: 2rem;
    text-align: center;
  }
</style>
