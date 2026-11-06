<script lang="ts">
  import Block from './Block.svelte';

  const centerZ = -34;
  const radius = 21.8;
  const segmentCount = 48;
  const segmentLength = ((Math.PI * 2 * radius) / segmentCount) * 1.04;
  const wallSegments = Array.from({ length: segmentCount }, (_, index) => {
    const angle = (index / segmentCount) * Math.PI * 2;
    return {
      angle,
      x: Math.sin(angle) * radius,
      z: centerZ + Math.cos(angle) * radius
    };
  }).filter((segment) => !(Math.cos(segment.angle) > 0.94 && Math.abs(segment.x) < 4.2));
</script>

{#each wallSegments as segment (segment.angle)}
  <Block
    position={[segment.x, 7.5, segment.z]}
    size={[segmentLength, 15, 0.55]}
    rotation={[0, segment.angle, 0]}
    color="#8d4c36"
  />
{/each}

<!-- The entrance remains a six-metre break aligned with the connecting passage. -->
<Block position={[-5.7, 10.5, -12.35]} size={[5.4, 9, 0.7]} color="#713b2c" />
<Block position={[5.7, 10.5, -12.35]} size={[5.4, 9, 0.7]} color="#713b2c" />
<Block position={[0, 12.1, -12.35]} size={[6, 5.8, 0.7]} color="#713b2c" />
