import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { IcosahedronGeometry, InstancedMesh, MeshToonMaterial, Object3D } from 'three';
import { toonGradient } from './toon';
import { atmosphere } from '../world/atmosphere';
import { route } from '../world/route';

const CLUSTERS = 46;

/** Puffy cel-shaded clouds: clusters of spheres, all in one instanced draw call. */
export function Clouds() {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new IcosahedronGeometry(1, 2), []);
  const material = useMemo(() => new MeshToonMaterial({ gradientMap: toonGradient, fog: false }), []);

  const puffs = useMemo(() => {
    const dummy = new Object3D();
    const out: Object3D['matrix'][] = [];
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let c = 0; c < CLUSTERS; c++) {
      const along = route.getPointAt(c / CLUSTERS);
      const side = (rand() > 0.5 ? 1 : -1) * (60 + rand() * 160);
      const cx = along.x + side;
      const cy = 55 + rand() * 50;
      const cz = along.z - 40 + rand() * 80;
      const size = 6 + rand() * 7;
      const count = 4 + Math.floor(rand() * 4);
      for (let i = 0; i < count; i++) {
        const s = size * (0.6 + rand() * 0.6);
        dummy.position.set(cx + (i - count / 2) * size * 0.8 + rand() * 3, cy + rand() * size * 0.4, cz + rand() * size * 0.6);
        dummy.scale.set(s, s * 0.75, s);
        dummy.updateMatrix();
        out.push(dummy.matrix.clone());
      }
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    puffs.forEach((matrix, i) => m.setMatrixAt(i, matrix));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [puffs]);

  useFrame(() => material.color.copy(atmosphere.cloud));

  return <instancedMesh ref={mesh} args={[geometry, material, puffs.length]} />;
}
