<script lang="ts">
  import Block from '../components/Block.svelte';
</script>

<Block position={[0, -0.1, -6.5]} size={[6, 0.2, 13]} color="#6e665f" />
<Block position={[-2.8, 3, -6.5]} size={[0.4, 6, 13]} color="#9a7258" />
<Block position={[2.8, 3, -6.5]} size={[0.4, 6, 13]} color="#9a7258" />
<Block position={[0, 6.05, -6.5]} size={[6, 0.3, 13]} color="#4e4139" />

{#each [-10.5, -6.5, -2.5] as z (z)}
  <Block position={[-2.45, 3, z]} size={[0.35, 6, 0.55]} color="#bd9275" />
  <Block position={[2.45, 3, z]} size={[0.35, 6, 0.55]} color="#bd9275" />
{/each}
