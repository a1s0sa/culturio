<script lang="ts">
  let {
    loading = false,
    disabled = false,
    onclick
  }: { loading?: boolean; disabled?: boolean; onclick: () => void } = $props();
</script>

<div>
  <button type="button" {disabled} {onclick}
    >{loading ? 'Loading artifacts…' : disabled ? 'End of the archive' : 'Load more'}</button
  >
</div>

<style>
  div {
    display: grid;
    place-items: center;
    padding: 2.5rem 0 5rem;
  }
  button {
    min-width: 10rem;
    border: 1px solid var(--color-ink);
    border-radius: 999px;
    background: transparent;
    padding: 0.75rem 1.2rem;
    color: var(--color-ink);
  }
  button:not(:disabled):hover {
    background: var(--color-ink);
    color: white;
  }
  button:disabled {
    opacity: 0.55;
  }
</style>
