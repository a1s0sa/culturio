<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Canvas, T } from '@threlte/core';
  import CameraController from './navigation/CameraController.svelte';
  import MuseumEnvironment from './components/MuseumEnvironment.svelte';
  import MuseumLighting from './components/MuseumLighting.svelte';
  import { museumConcept, type MuseumReviewView } from './config/museum';

  const walkView: MuseumReviewView = {
    id: 'walk',
    name: 'Walk start',
    position: museumConcept.camera.position,
    target: museumConcept.camera.target
  };

  let container = $state<HTMLElement>();
  let activeView = $state<MuseumReviewView>(museumConcept.reviewViews[0]);
  let pointerLocked = $state(false);
  let isCoarsePointer = $state(false);
  let reducedMotion = $state(false);
  let contextLost = $state(false);

  async function beginFirstPerson() {
    const isAlreadyAtWalkStart = activeView.id === walkView.id;
    activeView = walkView;
    await tick();

    window.setTimeout(
      () => container?.querySelector('canvas')?.requestPointerLock(),
      isAlreadyAtWalkStart || reducedMotion ? 0 : 1200
    );
  }

  function selectView(view: MuseumReviewView) {
    if (document.pointerLockElement) document.exitPointerLock();
    activeView = view;
  }

  onMount(() => {
    const coarseQuery = window.matchMedia('(pointer: coarse)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canvas = container?.querySelector('canvas');

    function updatePreferences() {
      isCoarsePointer = coarseQuery.matches;
      reducedMotion = motionQuery.matches;
    }

    function onPointerLockChange() {
      pointerLocked = document.pointerLockElement === canvas;
    }

    function onContextLost(event: Event) {
      event.preventDefault();
      contextLost = true;
    }

    updatePreferences();
    coarseQuery.addEventListener('change', updatePreferences);
    motionQuery.addEventListener('change', updatePreferences);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    canvas?.addEventListener('webglcontextlost', onContextLost);

    const requestedView = new URLSearchParams(window.location.search).get('view');
    const matchingView = museumConcept.reviewViews.find((view) => view.id === requestedView);
    if (matchingView) activeView = matchingView;

    return () => {
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      coarseQuery.removeEventListener('change', updatePreferences);
      motionQuery.removeEventListener('change', updatePreferences);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      canvas?.removeEventListener('webglcontextlost', onContextLost);
    };
  });
</script>

<section class="experience" bind:this={container} aria-label="Interactive museum blockout">
  <Canvas dpr={[1, 1.5]} shadows>
    <T.Color attach="background" args={['#b7a996']} />
    <T.Fog attach="fog" args={['#b7a996', 58, 125]} />
    <MuseumLighting />
    <MuseumEnvironment />
    <CameraController
      view={activeView}
      firstPerson={pointerLocked}
      touchEnabled={isCoarsePointer}
      {reducedMotion}
    />
  </Canvas>

  <div class="status-bar">
    <span>Blockout 01</span>
    <span>{activeView.name}</span>
    <span>{pointerLocked ? 'Walking' : 'Review camera'}</span>
  </div>

  <div class="instructions" class:quiet={pointerLocked}>
    <p class="eyebrow">Low-poly review</p>
    {#if isCoarsePointer}
      <strong>Choose a viewpoint. Drag the scene to look around.</strong>
    {:else if pointerLocked}
      <strong>WASD to move · mouse to look · Shift to move faster · Escape to release</strong>
    {:else}
      <strong>Review fixed views or enter first-person walking mode.</strong>
    {/if}
  </div>

  <nav class="view-controls" aria-label="Museum review viewpoints">
    {#each museumConcept.reviewViews as view}
      <button
        type="button"
        class:active={activeView.id === view.id && !pointerLocked}
        aria-pressed={activeView.id === view.id && !pointerLocked}
        onclick={() => selectView(view)}
      >
        {view.name}
      </button>
    {/each}
    {#if !isCoarsePointer}
      <button type="button" class="walk" onclick={beginFirstPerson}>
        {pointerLocked ? 'Walking' : 'Explore with WASD'}
      </button>
    {/if}
  </nav>

  {#if contextLost}
    <div class="context-fallback" role="alert">
      <h3>The 3D context was lost.</h3>
      <p>Reload this page to restart the blockout, or return to the digital gallery.</p>
      <a href="/gallery">Open gallery</a>
    </div>
  {/if}
</section>

<style>
  .experience {
    position: relative;
    height: min(78svh, 52rem);
    min-height: 34rem;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--color-line) 75%, transparent);
    border-radius: 1.25rem;
    background: #b7a996;
  }
  .status-bar {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    gap: 0.25rem;
  }
  .status-bar span,
  .instructions,
  .view-controls {
    border: 1px solid color-mix(in srgb, white 18%, transparent);
    background: color-mix(in srgb, #241d19 84%, transparent);
    color: #fffaf3;
    backdrop-filter: blur(12px);
  }
  .status-bar span {
    padding: 0.5rem 0.65rem;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .status-bar span:first-child {
    border-radius: 999px 0 0 999px;
  }
  .status-bar span:last-child {
    border-radius: 0 999px 999px 0;
  }
  .instructions {
    position: absolute;
    top: 1rem;
    left: 1rem;
    max-width: min(30rem, calc(100% - 2rem));
    padding: 0.9rem 1rem;
    border-radius: 0.9rem;
    transition: opacity 180ms ease;
  }
  .instructions.quiet {
    opacity: 0.38;
  }
  .instructions p {
    margin: 0 0 0.3rem;
    color: #dfac88;
  }
  .instructions strong {
    font-size: 0.82rem;
    font-weight: 500;
  }
  .view-controls {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    display: flex;
    gap: 0.35rem;
    width: fit-content;
    max-width: calc(100% - 2rem);
    margin-inline: auto;
    padding: 0.35rem;
    overflow-x: auto;
    border-radius: 999px;
  }
  button {
    flex: none;
    padding: 0.65rem 0.85rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 0.75rem;
  }
  button.active {
    background: #f1e6d6;
    color: #241d19;
  }
  button.walk {
    background: #a76545;
  }
  .context-fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    padding: 2rem;
    background: #241d19;
    color: #fffaf3;
    text-align: center;
  }
  .context-fallback h3 {
    font-family: var(--font-serif);
    font-size: 2.5rem;
  }
  .context-fallback a {
    text-decoration: underline;
    text-underline-offset: 0.3em;
  }

  @media (max-width: 680px) {
    .experience {
      min-height: 31rem;
      height: 72svh;
      border-radius: 0.9rem;
    }
    .status-bar span:nth-child(2) {
      display: none;
    }
    .instructions {
      top: auto;
      right: 1rem;
      bottom: 5rem;
      text-align: center;
    }
    .view-controls {
      justify-content: flex-start;
      margin-inline: 0;
    }
  }
</style>
