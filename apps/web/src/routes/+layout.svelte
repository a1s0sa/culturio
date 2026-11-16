<script lang="ts">
  import { onNavigate } from '$app/navigation';
  import '../app.css';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import MobileNavigation from '$lib/components/layout/MobileNavigation.svelte';
  let { children, data } = $props();

  onNavigate((navigation) => {
    const viewTransitionDocument = document as Document & {
      startViewTransition?: (callback: () => Promise<void>) => unknown;
    };
    if (
      !viewTransitionDocument.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;

    return new Promise<void>((resolve) => {
      viewTransitionDocument.startViewTransition!(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<Header user={data.user} />
{@render children()}
<Footer />
<MobileNavigation />
