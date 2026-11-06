<script lang="ts">
  import { T } from '@threlte/core';
  import { DoubleSide } from 'three';
  import Block from './Block.svelte';

  const centerZ = -34;
  const beams = Array.from({ length: 16 }, (_, index) => {
    const angle = (index / 16) * Math.PI * 2;
    return {
      angle,
      x: Math.sin(angle) * 14.5,
      z: centerZ + Math.cos(angle) * 14.5
    };
  });
</script>

<T.Mesh position={[0, 15, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
  <T.RingGeometry args={[7.5, 22, 64]} />
  <T.MeshStandardMaterial color="#2e2927" roughness={0.88} side={DoubleSide} />
</T.Mesh>

{#each beams as beam (beam.angle)}
  <Block
    position={[beam.x, 14.75, beam.z]}
    size={[0.42, 0.5, 14]}
    rotation={[0, beam.angle, 0]}
    color="#211e1d"
  />
{/each}

<T.Mesh position={[0, 15.05, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
  <T.PlaneGeometry args={[10, 8]} />
  <T.MeshStandardMaterial
    color="#b7d0d2"
    transparent
    opacity={0.34}
    roughness={0.2}
    side={DoubleSide}
  />
</T.Mesh>
<Block position={[0, 15.15, centerZ]} size={[0.35, 0.25, 8]} color="#252323" />
<Block position={[0, 15.15, centerZ]} size={[10, 0.25, 0.35]} color="#252323" />
