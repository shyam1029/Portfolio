import { useLayoutEffect, useMemo, useRef } from 'react';
import { IcosahedronGeometry, InstancedMesh, Object3D, ShaderMaterial } from 'three';
import cloudVert from '../shaders/cloud.vert?raw';
import cloudFrag from '../shaders/cloud.frag?raw';
import { uniforms } from '../world/atmosphere';
import { route } from '../world/route';

const CLUSTERS = 46;

/** Soft, sun-lit clouds: clusters of feathered spheres, all in one instanced draw call. */
export function Clouds() {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => new IcosahedronGeometry(1, 3), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: cloudVert,
        fragmentShader: cloudFrag,
        uniforms: {
          uTime: uniforms.uTime,
          uCloud: uniforms.uCloud,
          uSkyTop: uniforms.uSkyTop,
          uSkyBottom: uniforms.uSkyBottom,
          uSun: uniforms.uSun,
          uSunDir: uniforms.uSunDir,
          uSunIntensity: uniforms.uSunIntensity,
          uStorm: uniforms.uStorm,
          uFlash: uniforms.uFlash,
        },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

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
      const count = 7 + Math.floor(rand() * 6);
      for (let i = 0; i < count; i++) {
        const s = size * (0.6 + rand() * 0.6);
        dummy.position.set(cx + (i - count / 2) * size * 0.55 + rand() * 3, cy + rand() * size * 0.45 - Math.abs(i - count / 2) * 0.6, cz + (rand() - 0.5) * size * 0.9);
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


  return <instancedMesh ref={mesh} args={[geometry, material, puffs.length]} frustumCulled={false} />;
}
