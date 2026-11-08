import { useMemo } from 'react';
import { useThree, type ThreeElements } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending, ShaderMaterial } from 'three';
import vert from '../../shaders/particles.vert?raw';
import frag from '../../shaders/particles.frag?raw';
import { uniforms } from '../../world/atmosphere';

type ParticleProps = ThreeElements['points'] & {
  count: number;
  radius: number;
  height: number;
  speed: number;
  size: number;
  color: string;
  spread?: number;
  grow?: number;
  opacity?: number;
  soft?: boolean;
  additive?: boolean;
};

/** Looping rising particles: chimney smoke (soft) or glowing motes/sparks (additive). */
export function Particles({ count, radius, height, speed, size, color, spread = 0, grow = 0, opacity = 1, soft = false, additive = false, ...props }: ParticleProps) {
  const dpr = useThree((s) => s.viewport.dpr);
  const geometry = useMemo(() => {
    let seed = count * 13 + Math.round(radius * 7);
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const offsets = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * radius;
      offsets.set([Math.cos(a) * r, rand(), Math.sin(a) * r], i * 3);
      seeds[i] = rand();
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aOffset', new BufferAttribute(offsets, 3));
    g.setAttribute('aSeed', new BufferAttribute(seeds, 1));
    return g;
  }, [count, radius]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uTime: uniforms.uTime,
          uHeight: { value: height },
          uSpeed: { value: speed },
          uSpread: { value: spread },
          uSize: { value: size },
          uGrow: { value: grow },
          uPixelRatio: { value: dpr },
          uColor: { value: new Color(color) },
          uOpacity: { value: opacity },
          uSoft: { value: soft ? 1 : 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: additive ? AdditiveBlending : NormalBlending,
      }),
    [height, speed, spread, size, grow, dpr, color, opacity, soft, additive],
  );

  return <points geometry={geometry} material={material} frustumCulled={false} {...props} />;
}
