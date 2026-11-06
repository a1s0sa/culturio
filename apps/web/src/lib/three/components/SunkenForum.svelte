<script lang="ts">
  import { T } from '@threlte/core';
  import { DoubleSide } from 'three';
</script>

<T.Mesh position={[0, 0, -34]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
  <T.RingGeometry args={[16, 21.5, 64]} />
  <T.MeshStandardMaterial color="#87523f" roughness={0.95} side={DoubleSide} />
</T.Mesh>

<T.Mesh position={[0, -1.2, -34]} receiveShadow>
  <T.CylinderGeometry args={[16, 16, 1.6, 64]} />
  <T.MeshStandardMaterial color="#9b5b42" roughness={0.94} />
</T.Mesh>
<T.Mesh position={[0, -1.4, -34]} receiveShadow>
  <T.CylinderGeometry args={[13, 13, 1.2, 64]} />
  <T.MeshStandardMaterial color="#a76349" roughness={0.94} />
</T.Mesh>
<T.Mesh position={[0, -1.6, -34]} receiveShadow>
  <T.CylinderGeometry args={[10, 10, 0.8, 64]} />
  <T.MeshStandardMaterial color="#ad6d51" roughness={0.94} />
</T.Mesh>
<T.Mesh position={[0, -1.8, -34]} receiveShadow>
  <T.CylinderGeometry args={[7, 7, 0.4, 64]} />
  <T.MeshStandardMaterial color="#b8785b" roughness={0.94} />
</T.Mesh>
