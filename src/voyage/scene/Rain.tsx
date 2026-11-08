import { useMemo } from 'react';
import { BufferAttribute, BufferGeometry, ShaderMaterial } from 'three';
import rainVert from '../shaders/rain.vert?raw';
import rainFrag from '../shaders/rain.frag?raw';
import { uniforms } from '../world/atmosphere';

const DROPS = 2200;
const BOX = 70;

export function Rain() {
  const geometry = useMemo(() => {
    const pos = new Float32Array(DROPS * 6);
    const tip = new Float32Array(DROPS * 2);
    const seed = new Float32Array(DROPS * 2);
    for (let i = 0; i < DROPS; i++) {
      const x = Math.random() * BOX, y = Math.random() * BOX, z = Math.random() * BOX, s = Math.random();
      pos.set([x, y, z, x, y, z], i * 6);
      tip.set([0, 1], i * 2);
      seed.set([s, s], i * 2);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aTip', new BufferAttribute(tip, 1));
    g.setAttribute('aSeed', new BufferAttribute(seed, 1));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: rainVert,
        fragmentShader: rainFrag,
        uniforms: { uTime: uniforms.uTime, uStorm: uniforms.uStorm },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
}
