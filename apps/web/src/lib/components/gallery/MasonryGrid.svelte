<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { ArtifactCardView } from '@culturio/db';
  import ArtifactCard from './ArtifactCard.svelte';
  import { revealOnScroll } from '$lib/actions/reveal-on-scroll';
  let {
    items,
    onopen
  }: {
    items: ArtifactCardView[];
    onopen?: (event: MouseEvent, artifact: ArtifactCardView) => void;
  } = $props();
  let grid: HTMLElement;
  function layout() {
    if (!grid) return;
    for (const item of grid.children) {
      const element = item as HTMLElement;
      const ratio = Number(element.dataset.ratio ?? 1);
      const width = element.getBoundingClientRect().width;
      const span = Math.ceil((width * ratio + 76 + 16) / 12);
      element.style.gridRowEnd = `span ${span}`;
    }
  }
  onMount(() => {
    const observer = new ResizeObserver(() => requestAnimationFrame(layout));
    observer.observe(grid);
    return () => observer.disconnect();
  });
  $effect(() => {
    items.length;
    tick().then(layout);
  });
</script>

<div class="masonry" bind:this={grid}>
  {#each items as artifact, index (artifact.id)}<div
      class="cell"
      use:revealOnScroll={index % 6}
      data-ratio={artifact.image ? artifact.image.height / artifact.image.width : 1.15}
    >
      <ArtifactCard {artifact} eager={index < 2} {onopen} />
    </div>{/each}
</div>

<style>
  .masonry {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    grid-auto-rows: 4px;
    gap: 8px 16px;
    align-items: start;
  }
  .cell {
    min-width: 0;
  }
  @media (max-width: 1350px) {
    .masonry {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }
  @media (max-width: 1080px) {
    .masonry {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  @media (max-width: 820px) {
    .masonry {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 600px) {
    .masonry {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px 10px;
    }
  }
  @media (max-width: 330px) {
    .masonry {
      grid-template-columns: 1fr;
    }
  }
</style>
