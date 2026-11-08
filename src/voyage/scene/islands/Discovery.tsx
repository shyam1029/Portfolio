import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending, BoxGeometry, type BufferGeometry, CanvasTexture, DoubleSide, EdgesGeometry, type Group, IcosahedronGeometry, LineBasicMaterial,
  MathUtils, type Mesh, MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry, PlaneGeometry, SRGBColorSpace, TorusGeometry, TorusKnotGeometry,
} from 'three';
import { paint, stylise } from '../materials';
import { useHologram } from '../fx/Hologram';
import { Particles } from '../fx/Particles';
import { IslandBase, type IslandMaterials } from './IslandBase';
import { chapters } from '../../../content/story';
import { useVoyage } from '../../world/store';

const chapter = chapters.find((c) => c.id === 'discovery')!;

/**
 * Chapter 4: an island that draws itself, crowned by a data crystal and orbiting three.js primitives. A glowing wireframe appears first, then the solid,
 * coloured island materialises through it as you scroll: a ragged dissolve edge sweeps upward,
 * glowing cyan where the island is being 'drawn'.
 */
const SHAPES = [
  { geometry: new BoxGeometry(2.6, 2.6, 2.6), color: '#7ffcff' },
  { geometry: new IcosahedronGeometry(1.9, 0), color: '#b388ff' },
  { geometry: new TorusKnotGeometry(1.2, 0.38, 120, 14), color: '#7ffcff' },
  { geometry: new OctahedronGeometry(1.9, 0), color: '#ff8adf' },
  { geometry: new TorusGeometry(1.5, 0.45, 16, 40), color: '#b388ff' },
];

/** A primitive drawn as a hologram: glowing translucent body plus crisp edge lines. */
function HoloShape({ geometry, color, opacity }: { geometry: BufferGeometry; color: string; opacity: { value: number } }) {
  const body = useHologram(color);
  const edges = useMemo(() => new EdgesGeometry(geometry, 20), [geometry]);
  const lineMat = useMemo(() => new LineBasicMaterial({ color, transparent: true, blending: AdditiveBlending, depthWrite: false }), [color]);
  useFrame(() => {
    body.uniforms.uOpacity.value = opacity.value;
    lineMat.opacity = opacity.value;
  });
  return (
    <>
      <mesh geometry={geometry} material={body} />
      <lineSegments geometry={edges} material={lineMat} />
    </>
  );
}

/** Golden banner with a star, for "outstanding performer". */
function bannerTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 80;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#e8a91f';
  ctx.fillRect(0, 0, 128, 80);
  ctx.fillStyle = '#c8851a';
  ctx.fillRect(0, 70, 128, 10);
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 11 : 26;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(64 + Math.cos(a) * r, 38 + Math.sin(a) * r);
  }
  ctx.fill();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function Discovery({ radius, worldY = 0 }: { radius: number; worldY?: number }) {
  const orbit = useRef<Group>(null);
  const crystal = useRef<Group>(null);
  const flag = useRef<Group>(null);
  const banner = useRef<Mesh>(null);
  const magic = useMemo(() => ({ value: 0 }), []);
  const pillarMat = useHologram('#7ffcff');
  const bannerGeo = useMemo(() => new PlaneGeometry(3, 1.9, 12, 6).translate(1.5, 0, 0), []);
  const bannerMat = useMemo(() => {
    const m = new MeshStandardMaterial({ map: bannerTexture(), roughness: 0.6, side: DoubleSide, emissive: '#5a3a00', emissiveIntensity: 0.4 });
    stylise(m);
    return m;
  }, []);
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
            float dissolveGlow = 1.0 - smoothstep(0.0, 0.6, edge - vDissolveWorld.y);`,
          )
          .replace(
            '#include <emissivemap_fragment>',
            `#include <emissivemap_fragment>
            totalEmissiveRadiance += vec3(0.35, 1.1, 1.2) * dissolveGlow * 0.9;`,
          );
      };
      m.customProgramCacheKey = () => 'dissolve';
      m.userData.noShadow = true; // shadows would show the not-yet-drawn parts
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
    const time = clock.elapsedTime;
    const t = useVoyage.getState().progress;
    const local = MathUtils.clamp((t - chapter.range[0]) / (chapter.range[1] - chapter.range[0]), 0, 1);
    const reveal = MathUtils.smoothstep(local, 0.05, 0.45);
    // Sweep the dissolve edge from the seabed to above the palms.
    cut.value = worldY - 4 + reveal * 22;
    (wire.sand as MeshBasicMaterial).opacity = 0.85 * (1 - MathUtils.smoothstep(local, 0.5, 0.75));
    // The holograms fade in as the island takes shape, and stay.
    magic.value = MathUtils.smoothstep(local, 0.05, 0.4);
    pillarMat.uniforms.uOpacity.value = magic.value * 0.55;

    if (orbit.current) {
      orbit.current.rotation.y = time * 0.25;
      orbit.current.children.forEach((c, i) => {
        c.rotation.x = time * (0.4 + i * 0.1);
        c.rotation.y = time * (0.3 + i * 0.07);
        c.position.y = Math.sin(time * 0.9 + i * 1.3) * 1.2;
      });
    }
    if (crystal.current) {
      crystal.current.rotation.y = time * 0.5;
      crystal.current.position.y = 13 + Math.sin(time * 1.2) * 0.6;
      crystal.current.scale.setScalar(0.3 + magic.value * 0.7);
    }
    // The "outstanding performer" banner is raised in the second half of the chapter.
    if (flag.current) flag.current.position.y = MathUtils.lerp(1.5, 10, MathUtils.smoothstep(local, 0.35, 0.6));
    const b = banner.current;
    if (b) {
      const pos = b.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        pos.setZ(i, Math.sin(x * 2.2 - time * 4) * 0.15 * x);
      }
      pos.needsUpdate = true;
    }
  });

  const orbitRadius = radius * 0.55;
  return (
    <group>
      <IslandBase radius={radius} seed={51} palms={3} materials={solid} models={false} />
      <IslandBase radius={radius} seed={51} palms={3} materials={wire} models={false} />

      {/* Glowing data crystal at the heart of the island, with a pillar of light. */}
      <group ref={crystal} position={[0, 13, 0]}>
        <mesh material={paint('#9ffcff', { emissive: '#3fe0ff', roughness: 0.2, metalness: 0.1 })} scale={[1.4, 3.2, 1.4]}>
          <octahedronGeometry args={[1, 0]} />
        </mesh>
        <HoloShape geometry={SHAPES[3].geometry} color="#7ffcff" opacity={magic} />
        <pointLight color="#6ff4ff" intensity={60} distance={45} />
      </group>
      <mesh material={pillarMat} position={[0, 18, 0]}>
        <cylinderGeometry args={[1.6, 2.6, 36, 24, 1, true]} />
      </mesh>

      {/* three.js primitives orbiting as holograms. */}
      <group ref={orbit} position={[0, 12, 0]}>
        {SHAPES.map((s, i) => {
          const a = (i / SHAPES.length) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius]}>
              <HoloShape geometry={s.geometry} color={s.color} opacity={magic} />
            </group>
          );
        })}
      </group>

      {/* Data motes rising off the island. */}
      <Particles count={260} radius={radius * 0.8} height={26} speed={0.12} size={0.5} color="#8ffcff" additive opacity={0.9} position-y={1} />

      {/* Flagpole with the golden banner. */}
      <group position={[radius * 0.32, radius * 0.18, -radius * 0.25]}>
        <mesh material={paint('#5e3a22')} position-y={6}>
          <cylinderGeometry args={[0.14, 0.16, 12, 8]} />
        </mesh>
        <mesh material={paint('#f2b632', { metalness: 0.7, roughness: 0.3 })} position-y={12.2}>
          <sphereGeometry args={[0.3, 12, 8]} />
        </mesh>
        <group ref={flag} position-y={1.5}>
          <mesh ref={banner} geometry={bannerGeo} material={bannerMat} />
        </group>
      </group>
    </group>
  );
}
