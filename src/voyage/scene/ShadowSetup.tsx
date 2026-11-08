import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, MeshStandardMaterial } from 'three';

/** Every standard-material mesh casts and receives shadows (re-checked as islands stream in). */
export function ShadowSetup() {
  const scene = useThree((s) => s.scene);
  const next = useRef(0);
  useFrame(({ clock }) => {
    if (clock.elapsedTime < next.current) return;
    next.current = clock.elapsedTime + 1;
    scene.traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshStandardMaterial && !o.userData.shadowsSet) {
        o.castShadow = !o.material.transparent;
        o.receiveShadow = true;
        o.userData.shadowsSet = true;
      }
    });
  });
  return null;
}
