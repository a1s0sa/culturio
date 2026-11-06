<script lang="ts">
  import { T } from '@threlte/core';
</script>

<T.HemisphereLight args={['#fff1d8', '#584b42', 1.35]} />
<T.AmbientLight intensity={0.55} />
<T.DirectionalLight position={[18, 34, -8]} intensity={2.8} castShadow />
<T.PointLight position={[0, 7, 8]} intensity={18} distance={30} color="#ffd9ad" />
<T.PointLight position={[0, 13, -34]} intensity={24} distance={52} color="#f0c39e" />
