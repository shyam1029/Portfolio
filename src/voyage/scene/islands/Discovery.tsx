import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, type Group, MathUtils, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { paint } from '../materials';
import { IslandBase, type IslandMaterials } from './IslandBase';
import { chapters } from '../../../content/story';
import { useVoyage } from '../../world/store';

const chapter = chapters.find((c) => c.id === 'discovery')!;

/**
 * Chapter 4: an island that draws itself. A glowing wireframe appears first, then the solid,
 * coloured island materialises through it as you scroll: a ragged dissolve edge sweeps upward,
 * glowing cyan where the island is being 'drawn'.
 */
export function Discovery({ radius, worldY = 0 }: { radius: number; worldY?: number }) {
  const compass = useRef<Group>(null);
  const flag = useRef<Group>(null);
  const cut = useMemo(() => ({ value: -10 }), []);

  const { solid, wire } = useMemo(() => {
    const make = (color: string): MeshStandardMaterial => {
      const m = new MeshStandardMaterial({ color, roughness: 0.85 });
      m.onBeforeCompile = (shader) => {
        shader.uniforms.uCut = cut;
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vDissolveWorld;')
          .replace('#include <project_vertex>', '#include <project_vertex>\nvDissolveWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
            uniform float uCut;
            varying vec3 vDissolveWorld;
            float dHash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.7); }
            float dNoise(vec2 p) {
              vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
              return mix(mix(dHash(i), dHash(i + vec2(1, 0)), f.x), mix(dHash(i + vec2(0, 1)), dHash(i + vec2(1, 1)), f.x), f.y);
            }`,
          )
          .replace(
            '#include <clipping_planes_fragment>',
            `#include <clipping_planes_fragment>
            float edge = uCut + (dNoise(vDissolveWorld.xz * 0.6) - 0.5) * 3.0 + (dNoise(vDissolveWorld.xz * 2.3) - 0.5) * 1.0;
            if (vDissolveWorld.y > edge) discard;
            float dissolveGlow = 1.0 - smoothstep(0.0, 1.2, edge - vDissolveWorld.y);`,
          )
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
            totalEmissiveRadiance += vec3(0.5, 1.6, 1.7) * dissolveGlow * 2.5;`,
          );
      };
      m.customProgramCacheKey = () => 'dissolve';
      return m;
    };
    const solidMats: IslandMaterials = {
      sand: make('#f2d59a'), grass: make('#4fc6a0'), rock: make('#8d8a99'), trunk: make('#9a6a3e'), leaf: make('#2aa37f'),
    };
    const w = new MeshBasicMaterial({ color: '#7ffcff', wireframe: true, transparent: true, opacity: 0.8, side: DoubleSide });
    const wireMats: IslandMaterials = { sand: w, grass: w, rock: w, trunk: w, leaf: w };
    return { solid: solidMats, wire: wireMats };
  }, [cut]);

  useFrame(({ clock }) => {
    const t = useVoyage.getState().progress;
    const local = MathUtils.clamp((t - chapter.range[0]) / (chapter.range[1] - chapter.range[0]), 0, 1);
    const reveal = MathUtils.smoothstep(local, 0.1, 0.55);
    // Plane keeps everything below `constant`; sweep it from the seabed to above the palms.
    cut.value = worldY - 4 + reveal * 22;
    (wire.sand as MeshBasicMaterial).opacity = 0.85 * (1 - MathUtils.smoothstep(local, 0.5, 0.75));

    if (compass.current) {
      compass.current.rotation.y = clock.elapsedTime * 0.8;
      compass.current.position.y = 15 + Math.sin(clock.elapsedTime * 1.4) * 0.8;
    }
    // The "outstanding performer" flag is raised in the second half of the chapter.
    if (flag.current) flag.current.position.y = MathUtils.lerp(2, 9, MathUtils.smoothstep(local, 0.55, 0.85));
  });

  return (
    <group>
      <IslandBase radius={radius} seed={51} palms={3} materials={solid} models={false} />
      <IslandBase radius={radius} seed={51} palms={3} materials={wire} models={false} />
      {/* glowing compass */}
      <group ref={compass} position={[0, 15, 0]}>
        <mesh material={paint('#f2b632', '#a8741a')}>
          <torusGeometry args={[2.2, 0.25, 10, 40]} />
        </mesh>
        <mesh material={paint('#7ffcff', '#2fb8c0')} rotation-z={Math.PI / 2}>
          <coneGeometry args={[0.35, 3.6, 4]} />
        </mesh>
        <pointLight color="#7ffcff" intensity={30} distance={30} />
      </group>
      {/* flagpole with a golden star pennant */}
      <group position={[radius * 0.3, radius * 0.2, -radius * 0.2]}>
        <mesh material={paint('#5e3a22')} position-y={5}>
          <cylinderGeometry args={[0.12, 0.12, 10, 8]} />
        </mesh>
        <group ref={flag} position-y={2}>
          <mesh material={paint('#f2b632', '#6b4a00')} position={[1.2, 0, 0]}>
            <planeGeometry args={[2.4, 1.5]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
