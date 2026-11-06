<script lang="ts">
  import { T } from '@threlte/core';

  type Vector3Tuple = [number, number, number];

  let {
    position,
    size,
    color,
    rotation = [0, 0, 0]
  }: {
    position: Vector3Tuple;
    size: Vector3Tuple;
    color: string;
    rotation?: Vector3Tuple;
  } = $props();
</script>

<T.Mesh {position} {rotation} receiveShadow castShadow>
  <T.BoxGeometry args={size} />
  <T.MeshStandardMaterial {color} roughness={0.92} metalness={0} />
</T.Mesh>
