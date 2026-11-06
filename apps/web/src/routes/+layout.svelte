<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/layout/Header.svelte';
  import MobileNavigation from '$lib/components/layout/MobileNavigation.svelte';
  let { children } = $props();
</script>

<Header />
{@render children()}
<MobileNavigation />
