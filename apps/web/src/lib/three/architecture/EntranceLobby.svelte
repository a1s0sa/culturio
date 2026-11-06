<script lang="ts">
  import Block from '../components/Block.svelte';

  const plaster = '#b98260';
  const innerWall = '#cba98d';
  const floor = '#746b62';
  const roof = '#59483d';
</script>

<!-- Floor and ceremonial entrance apron -->
<Block position={[0, -0.1, 8]} size={[18, 0.2, 16]} color={floor} />
<Block position={[0, -0.12, 20]} size={[18, 0.16, 8]} color="#8c7f73" />

<!-- Deep entrance volumes with a five-metre opening -->
<Block position={[-5.75, 4.5, 17]} size={[6.5, 9, 2]} color={plaster} />
<Block position={[5.75, 4.5, 17]} size={[6.5, 9, 2]} color={plaster} />
<Block position={[0, 8, 16.8]} size={[5, 2, 1.6]} color={plaster} />

<!-- Lobby shell and rhythmic side piers -->
<Block position={[-8.8, 4.5, 8]} size={[0.4, 9, 16]} color={innerWall} />
<Block position={[8.8, 4.5, 8]} size={[0.4, 9, 16]} color={innerWall} />

{#each [3, 7, 11] as z}
  <Block position={[-8.45, 4.5, z]} size={[0.7, 9, 0.9]} color={plaster} />
  <Block position={[8.45, 4.5, z]} size={[0.7, 9, 0.9]} color={plaster} />
{/each}

<!-- North wall frames the six-metre passage -->
<Block position={[-6, 4.5, 0]} size={[6, 9, 0.4]} color={innerWall} />
<Block position={[6, 4.5, 0]} size={[6, 9, 0.4]} color={innerWall} />
<Block position={[0, 7.5, 0]} size={[6, 3, 0.4]} color={innerWall} />

<!-- Split roof leaves a two-metre linear daylight slot -->
<Block position={[-5, 9.05, 8]} size={[8, 0.3, 16]} color={roof} />
<Block position={[5, 9.05, 8]} size={[8, 0.3, 16]} color={roof} />
