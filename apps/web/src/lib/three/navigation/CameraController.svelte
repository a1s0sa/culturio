<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { T, useTask, useThrelte } from '@threlte/core';
  import { Euler, MathUtils, PerspectiveCamera, Quaternion, Vector3 } from 'three';
  import type { MuseumReviewView } from '../config/museum';
  import { getFloorHeight, resolveMovement } from './CollisionSystem';

  let {
    view,
    firstPerson = false,
    touchEnabled = false,
    reducedMotion = false
  }: {
    view: MuseumReviewView;
    firstPerson?: boolean;
    touchEnabled?: boolean;
    reducedMotion?: boolean;
  } = $props();

  const { canvas } = useThrelte();
  const keys = new SvelteSet<string>();
  const up = new Vector3(0, 1, 0);
  let cameraRef = $state.raw<PerspectiveCamera>();
  let activeViewId = '';
  let yaw = 0;
  let pitch = 0;
  let activeTouch: number | null = null;
  let lastTouch = { x: 0, y: 0 };
  let transition: {
    elapsed: number;
    duration: number;
    fromPosition: Vector3;
    toPosition: Vector3;
    fromQuaternion: Quaternion;
    toQuaternion: Quaternion;
  } | null = null;

  function quaternionFor(nextView: MuseumReviewView) {
    const camera = new PerspectiveCamera();
    camera.position.fromArray([...nextView.position]);
    camera.up.copy(up);
    camera.lookAt(new Vector3(...nextView.target));
    return camera.quaternion.clone();
  }

  function syncAnglesFromCamera() {
    if (!cameraRef) return;
    const euler = new Euler().setFromQuaternion(cameraRef.quaternion, 'YXZ');
    pitch = euler.x;
    yaw = euler.y;
  }

  function applyLook() {
    cameraRef?.quaternion.setFromEuler(new Euler(pitch, yaw, 0, 'YXZ'));
  }

  $effect(() => {
    if (!cameraRef || view.id === activeViewId) return;
    activeViewId = view.id;
    const toPosition = new Vector3(...view.position);
    const toQuaternion = quaternionFor(view);

    if (reducedMotion) {
      cameraRef.position.copy(toPosition);
      cameraRef.quaternion.copy(toQuaternion);
      transition = null;
      syncAnglesFromCamera();
      return;
    }

    transition = {
      elapsed: 0,
      duration: 1.15,
      fromPosition: cameraRef.position.clone(),
      toPosition,
      fromQuaternion: cameraRef.quaternion.clone(),
      toQuaternion
    };
  });

  $effect(() => {
    if (firstPerson && cameraRef) {
      transition = null;
      cameraRef.position.y = 1.7;
      syncAnglesFromCamera();
    }
  });

  onMount(() => {
    const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight']);

    function onKeyDown(event: KeyboardEvent) {
      if (!movementKeys.has(event.code)) return;
      keys.add(event.code);
      if (firstPerson) event.preventDefault();
    }

    function onKeyUp(event: KeyboardEvent) {
      keys.delete(event.code);
    }

    function onPointerMove(event: PointerEvent) {
      if (document.pointerLockElement === canvas) {
        yaw -= event.movementX * 0.002;
        pitch = MathUtils.clamp(pitch - event.movementY * 0.002, -1.35, 1.35);
        applyLook();
        return;
      }

      if (!touchEnabled || event.pointerId !== activeTouch) return;
      yaw -= (event.clientX - lastTouch.x) * 0.006;
      pitch = MathUtils.clamp(pitch - (event.clientY - lastTouch.y) * 0.006, -1.25, 1.25);
      lastTouch = { x: event.clientX, y: event.clientY };
      applyLook();
    }

    function onPointerDown(event: PointerEvent) {
      if (!touchEnabled || event.pointerType !== 'touch') return;
      activeTouch = event.pointerId;
      lastTouch = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    }

    function onPointerUp(event: PointerEvent) {
      if (event.pointerId === activeTouch) activeTouch = null;
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    return () => {
      keys.clear();
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  });

  useTask((delta) => {
    if (!cameraRef) return;

    if (transition) {
      transition.elapsed = Math.min(transition.elapsed + delta, transition.duration);
      const progress = transition.elapsed / transition.duration;
      const eased = progress * progress * (3 - 2 * progress);
      cameraRef.position.lerpVectors(transition.fromPosition, transition.toPosition, eased);
      cameraRef.quaternion.slerpQuaternions(
        transition.fromQuaternion,
        transition.toQuaternion,
        eased
      );

      if (progress === 1) {
        transition = null;
        syncAnglesFromCamera();
      }
      return;
    }

    if (!firstPerson) return;

    const forwardInput = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
    const rightInput = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
    if (forwardInput === 0 && rightInput === 0) return;

    const movement = new Vector3(Math.sin(yaw), 0, -Math.cos(yaw)).multiplyScalar(forwardInput);
    movement.add(new Vector3(Math.cos(yaw), 0, Math.sin(yaw)).multiplyScalar(rightInput));
    movement.normalize();
    movement.multiplyScalar((keys.has('ShiftLeft') || keys.has('ShiftRight') ? 5.2 : 3.2) * delta);

    const [x, z] = resolveMovement(
      [cameraRef.position.x, cameraRef.position.z],
      [movement.x, movement.z]
    );
    cameraRef.position.set(x, 1.7 + getFloorHeight([x, z]), z);
  });
</script>

<T.PerspectiveCamera
  bind:ref={cameraRef}
  makeDefault
  position={[...view.position]}
  fov={58}
  near={0.1}
  far={180}
/>
