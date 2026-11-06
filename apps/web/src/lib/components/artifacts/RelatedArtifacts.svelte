<script lang="ts">
  import type { ArtifactCardView } from '@culturio/db';
  import ArtifactCard from '../gallery/ArtifactCard.svelte';
  let { items }: { items: ArtifactCardView[] } = $props();
</script>

{#if items.length}<section class="related">
    <p class="eyebrow">Continue exploring</p>
    <h2 class="editorial-title">Related artifacts</h2>
    <div>
      {#each items as artifact}<ArtifactCard {artifact} />{/each}
    </div>
  </section>{/if}

<style>
  .related {
    margin-top: 5rem;
    padding-top: 2.5rem;
    border-top: 1px solid var(--color-line);
  }
  h2 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    margin: 0.25rem 0 1.5rem;
  }
  .related > div {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
  }
  @media (max-width: 900px) {
    .related > div {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  @media (max-width: 600px) {
    .related > div {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
