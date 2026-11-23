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

<div class="desktop-shell">
  <Header user={data.user} authEnabled={data.authEnabled} />
  <div class="page-content">
    {@render children()}
    <Footer />
  </div>
  <MobileNavigation />
</div>

<style>
  .page-content {
    min-height: 100vh;
    margin-left: 5.25rem;
    padding-top: 4.65rem;
  }

  @media (max-width: 700px) {
    .page-content {
      margin-left: 0;
      padding-top: 4.15rem;
    }
  }
</style>
