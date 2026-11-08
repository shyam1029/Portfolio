import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, MeshStandardMaterial } from 'three';
import { useVoyage } from '../world/store';

/**
 * Mounted inside the Suspense boundary, so it only runs once every model has loaded.
 * It enables shadows on all meshes, pre-compiles every shader (so nothing stalls when the
 * curtain lifts), renders a few warm-up frames behind the curtain, then marks the scene ready.
 */
export function SceneReady() {
  const { gl, scene, camera } = useThree();
  const compiled = useRef(false);
  const warmup = useRef(0);

  useEffect(() => {
    let cancelled = false;
    scene.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial && !o.userData.shadowsSet) {
        o.castShadow = !o.material.transparent && !o.material.userData.noShadow;
        o.receiveShadow = true;
        o.userData.shadowsSet = true;
      }
    });
    const done = () => {
      if (!cancelled) compiled.current = true;
    };
    // compileAsync uses parallel shader compilation where the browser supports it.
    gl.compileAsync(scene, camera).then(done, done);
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  useFrame(() => {
    if (!compiled.current || useVoyage.getState().ready) return;
    // A few real frames (shadow maps, environment, post-processing) before revealing.
    if (++warmup.current > 4) {
      useVoyage.getState().setReady();
      if (import.meta.env.DEV) console.info(`[voyage] ready after ${Math.round(performance.now())} ms`);
    }
  });
  return null;
}
