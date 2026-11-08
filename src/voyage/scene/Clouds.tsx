import { useMemo } from 'react';
import { InstancedBufferAttribute, InstancedBufferGeometry, PlaneGeometry, ShaderMaterial } from 'three';
import cloudVert from '../shaders/cloud.vert?raw';
import cloudFrag from '../shaders/cloud.frag?raw';
import { uniforms } from '../world/atmosphere';
import { route } from '../world/route';

const CLOUDS = 42;
const HORIZON_CLOUDS = 26;

/**
 * Soft, sun-lit clouds: each cloud is a cluster of camera-facing puffs whose shape comes from
 * animated noise in the shader. All puffs share one instanced draw call.
 */
export function Clouds() {
  const geometry = useMemo(() => {
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const centers: number[] = [];
    const sizes: number[] = [];
    const seeds: number[] = [];
    const shades: number[] = [];
    for (let c = 0; c < CLOUDS + HORIZON_CLOUDS; c++) {
      const horizon = c >= CLOUDS; // a lower, farther ring so clouds frame the horizon in every shot
      const along = route.getPointAt(horizon ? rand() : c / CLOUDS);
      const side = (rand() > 0.5 ? 1 : -1) * (horizon ? 260 + rand() * 220 : 70 + rand() * 220);
      const cx = along.x + side;
      const cy = horizon ? 30 + rand() * 30 : 60 + rand() * 55;
      const cz = along.z - 60 + rand() * 120 - (horizon ? 150 : 0);
      const width = (24 + rand() * 34) * (horizon ? 1.8 : 1);
      const puffs = 16 + Math.floor(rand() * 12);
      for (let i = 0; i < puffs; i++) {
        // Flat-bottomed, domed shape: wider at the base, piling up in the middle.
        const u = rand() * 2 - 1;
        const dome = 1 - u * u;
        const height = rand() * width * 0.35 * dome;
        centers.push(cx + u * width, cy + height, cz + (rand() - 0.5) * width * 0.4);
        sizes.push((13 + rand() * 12) * (0.6 + dome * 0.6) * (horizon ? 1.8 : 1));
        seeds.push(rand());
        shades.push(Math.min(1, height / (width * 0.35) + 0.2));
      }
    }
    const g = new InstancedBufferGeometry().copy(new PlaneGeometry(1, 1) as unknown as InstancedBufferGeometry);
    g.instanceCount = sizes.length;
    g.setAttribute('aCenter', new InstancedBufferAttribute(new Float32Array(centers), 3));
    g.setAttribute('aSize', new InstancedBufferAttribute(new Float32Array(sizes), 1));
    g.setAttribute('aSeed', new InstancedBufferAttribute(new Float32Array(seeds), 1));
    g.setAttribute('aShade', new InstancedBufferAttribute(new Float32Array(shades), 1));
    return g;
  }, []);

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

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />;
}
