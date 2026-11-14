<script lang="ts">
  import type { PageProps } from './$types';
  import SocialMeta from '$lib/components/seo/SocialMeta.svelte';
  import { untrack } from 'svelte';

  let { data }: PageProps = $props();
  let email = $state('');
  let pending = $state(false);
  let sent = $state(untrack(() => data.sent));
  let error = $state(
    untrack(() =>
      data.error ? 'That sign-in link is invalid or has expired. Request a new one.' : ''
    )
  );

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    pending = true;
    error = '';
    try {
      const response = await fetch('/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          callbackURL: data.returnTo,
          errorCallbackURL: `/sign-in?returnTo=${encodeURIComponent(data.returnTo)}&error=1`
        })
      });
      if (!response.ok) throw new Error('Unable to send the sign-in link. Please try again.');
      sent = true;
    } catch {
      error = 'We could not send your link. Check your email address and try again.';
    } finally {
      pending = false;
    }
  }
</script>

<svelte:head>
  <title>Sign in — Culturio</title>
  <meta
    name="description"
    content="Sign in to continue exploring Culturio's archive of African artifacts."
  />
  <meta name="robots" content="noindex" />
  <link rel="canonical" href="https://culturio.africa/sign-in" />
</svelte:head>
<SocialMeta
  title="Sign in — Culturio"
  description="Sign in to continue exploring Culturio's archive of African artifacts."
  url="https://culturio.africa/sign-in"
  image="https://culturio.africa/opengraph/culturio-home.jpg"
  imageAlt="Culturio's open archive of African artifacts"
/>

<main class="page-shell">
  <section aria-labelledby="sign-in-title">
    <p class="eyebrow">Your archive, continued</p>
    <h1 id="sign-in-title" class="editorial-title">Sign in to Culturio</h1>
    {#if sent}
      <p class="message" role="status">
        If an account exists for that address, a sign-in link is on its way.
      </p>
      <p class="hint">
        The link expires in 5 minutes. You can close this page after opening your email.
      </p>
    {:else}
      <p class="intro">Enter your email and we’ll send you a secure sign-in link.</p>
      <form method="POST" onsubmit={submit}>
        <label for="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          bind:value={email}
          autocomplete="email"
          required
        />
        <button type="submit" disabled={pending}
          >{pending ? 'Sending…' : 'Email me a sign-in link'}</button
        >
      </form>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      <p class="hint">New to Culturio? Your account will be created when you use the link.</p>
    {/if}
  </section>
</main>

<style>
  main {
    min-height: 70vh;
    display: grid;
    place-items: center;
  }
  section {
    width: min(100%, 30rem);
    padding: 3rem;
    background: var(--color-paper);
    border: 1px solid var(--color-line);
  }
  h1 {
    font-size: clamp(2.8rem, 8vw, 4.5rem);
    line-height: 0.95;
    margin: 0.5rem 0 1rem;
  }
  .intro,
  .hint {
    color: var(--color-muted);
    line-height: 1.6;
  }
  form {
    display: grid;
    gap: 0.75rem;
    margin-top: 1.75rem;
  }
  label {
    font-size: 0.9rem;
    font-weight: 500;
  }
  input {
    width: 100%;
    padding: 0.85rem;
    border: 1px solid var(--color-line);
    background: white;
  }
  button {
    padding: 0.9rem 1rem;
    border: 0;
    background: var(--color-ink);
    color: var(--color-paper);
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.65;
    cursor: wait;
  }
  .hint {
    font-size: 0.85rem;
    margin-top: 1.25rem;
  }
  .error {
    color: #9b342d;
  }
  .message {
    line-height: 1.6;
  }
  @media (max-width: 520px) {
    section {
      padding: 2rem 1.25rem;
    }
  }
</style>
