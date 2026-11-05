<svelte:head>
  <title>Culturio</title>
  <meta name="description" content="An open digital archive of African historical artifacts." />
</svelte:head>

<main>
  <p class="eyebrow">Culturio</p>
  <h1>African history, preserved and discoverable.</h1>
  <p>The archive foundation is being assembled. The digital gallery is coming in a later phase.</p>
</main>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: #f3ede2; color: #231b14; font-family: Georgia, serif; }
  main { max-width: 48rem; min-height: 100vh; display: grid; align-content: center; gap: 1rem; padding: 3rem; }
  .eyebrow { font: 600 0.75rem/1 system-ui, sans-serif; letter-spacing: 0.18em; text-transform: uppercase; }
  h1 { max-width: 13ch; margin: 0; font-size: clamp(3rem, 9vw, 6.5rem); line-height: 0.92; font-weight: 500; }
  p { max-width: 42rem; margin: 0; font-size: 1.1rem; line-height: 1.6; }
</style>
