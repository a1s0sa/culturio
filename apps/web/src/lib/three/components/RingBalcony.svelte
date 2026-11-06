<script lang="ts">
  import { T } from '@threlte/core';
  import { DoubleSide } from 'three';
  import Block from './Block.svelte';

  const centerZ = -34;
  const columns = Array.from({ length: 16 }, (_, index) => {
    const angle = (index / 16) * Math.PI * 2;
    return { angle, x: Math.sin(angle) * 17.5, z: centerZ + Math.cos(angle) * 17.5 };
  });
  const innerScreen = Array.from({ length: 48 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2;
    return { angle, x: Math.sin(angle) * 12, z: centerZ + Math.cos(angle) * 12 };
  });
  const upperScreen = Array.from({ length: 64 }, (_, index) => {
    const angle = (index / 64) * Math.PI * 2;
    return { angle, x: Math.sin(angle) * 20.7, z: centerZ + Math.cos(angle) * 20.7 };
  });
</script>

{#each columns as column (column.angle)}
  <Block position={[column.x, 3.5, column.z]} size={[0.72, 7, 0.72]} color="#6d5245" />
{/each}

<T.Mesh position={[0, 7, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
  <T.RingGeometry args={[11.5, 20.7, 64]} />
  <T.MeshStandardMaterial color="#6c493a" roughness={0.94} side={DoubleSide} />
</T.Mesh>

{#each innerScreen as segment (segment.angle)}
  <Block
    position={[segment.x, 8.15, segment.z]}
    size={[1.05, 2.1, 0.42]}
    rotation={[0, segment.angle, 0]}
    color="#a45f43"
  />
{/each}

{#each upperScreen as segment (segment.angle)}
  <Block
    position={[segment.x, 11, segment.z]}
    size={[1.25, 3.6, 0.38]}
    rotation={[0, segment.angle, 0]}
    color="#9c573e"
  />
{/each}
