import { useMemo } from 'react';
import { CylinderGeometry, SphereGeometry, type Material } from 'three';
import { paint } from '../materials';
import { usePlantKit } from './plantKit';

export type IslandMaterials = { sand: Material; grass: Material; rock: Material; trunk: Material; leaf: Material };

export const defaultIslandMaterials = (): IslandMaterials => ({
  sand: paint('#ecd3a0', { roughness: 0.95 }),
  grass: paint('#4fa84a', { roughness: 0.9 }),
  rock: paint('#8d8a99'),
  trunk: paint('#9a6a3e'),
  leaf: paint('#2f9e57', { sway: 1, roughness: 0.6 }),
});

/** Tiny seeded PRNG so every island looks the same on every visit. */
export function seeded(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function lumpy<T extends CylinderGeometry | SphereGeometry>(g: T, rand: () => number, amount: number) {
  const pos = g.attributes.position;
  const offsets = Array.from({ length: 12 }, () => rand() * amount);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + offsets[Math.floor(((a + Math.PI) / (Math.PI * 2)) * 12) % 12] * 0.5 + Math.sin(a * 5) * amount * 0.3;
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

export function Palm({ height = 7, lean = 0.3, materials }: { height?: number; lean?: number; materials: IslandMaterials }) {
  const segments = 6;
  return (
    <group rotation-z={lean}>
      {Array.from({ length: segments }, (_, i) => (
        <mesh key={i} material={materials.trunk} position={[Math.sin(i / segments) * lean * 2, (i + 0.5) * (height / segments), 0]}>
          <cylinderGeometry args={[0.22 - i * 0.02, 0.26 - i * 0.02, height / segments, 7]} />
        </mesh>
      ))}
      <group position={[Math.sin(1) * lean * 2, height, 0]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} material={materials.leaf} rotation={[0.9, (i / 7) * Math.PI * 2, 0]} position-y={-0.2}>
            <coneGeometry args={[0.5, 3.6, 4]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Height of the grassy mound's surface at distance `d` from the island centre. */
const moundHeight = (radius: number, d: number) => {
  const R = radius * 0.72;
  return 0.4 + 0.32 * Math.sqrt(Math.max(R * R - d * d, 0));
};

/** Real date palms on the mound plus bushes and grass tufts, placed with a seeded layout. */
function Plants({ radius, seed, palms }: { radius: number; seed: number; palms: number }) {
  const kit = usePlantKit();
  const spots = useMemo(() => {
    const rand = seeded(seed * 7 + 1);
    const out: { plant: (typeof kit.palms)[number]; pos: [number, number, number]; rot: number; scale: number }[] = [];
    for (let i = 0; i < palms; i++) {
      const a = rand() * Math.PI * 2;
      const d = radius * (0.25 + rand() * 0.4);
      out.push({ plant: kit.palms[i % kit.palms.length], pos: [Math.cos(a) * d, moundHeight(radius, d) - 0.3, Math.sin(a) * d], rot: rand() * 6.28, scale: 1.5 + rand() * 0.7 });
    }
    const bushCount = Math.round(radius * 0.9);
    for (let i = 0; i < bushCount; i++) {
      const a = rand() * Math.PI * 2;
      const d = radius * (0.15 + rand() * 0.6);
      out.push({ plant: kit.bushes[Math.floor(rand() * kit.bushes.length)], pos: [Math.cos(a) * d, moundHeight(radius, d) - 0.15, Math.sin(a) * d], rot: rand() * 6.28, scale: 1.6 + rand() * 1.4 });
    }
    return out;
  }, [kit, radius, seed, palms]);

  return (
    <>
      {spots.map((s, i) => (
        <mesh key={i} geometry={s.plant.geometry} material={s.plant.material} position={s.pos} rotation-y={s.rot} scale={s.scale} castShadow receiveShadow />
      ))}
    </>
  );
}

/** Sandy island with a grassy mound, rocks and palms. Landmarks are passed as children. */
export function IslandBase({
  radius,
  seed,
  palms = 3,
  materials,
  grass = true,
  models = true,
  children,
}: {
  radius: number;
  seed: number;
  palms?: number;
  materials: IslandMaterials;
  grass?: boolean;
  /** Use the real palm/vegetation models (false keeps the simple procedural palms). */
  models?: boolean;
  children?: React.ReactNode;
}) {
  const { sand, mound, rocks, palmSpots } = useMemo(() => {
    const rand = seeded(seed);
    const sandGeo = lumpy(new CylinderGeometry(radius, radius * 1.18, 5, 40, 2), rand, 0.12);
    const moundGeo = lumpy(new SphereGeometry(radius * 0.72, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), rand, 0.15);
    const rockList = Array.from({ length: 5 }, () => {
      const a = rand() * Math.PI * 2;
      const r = radius * (0.85 + rand() * 0.25);
      return { pos: [Math.cos(a) * r, 0.6, Math.sin(a) * r] as const, s: 0.8 + rand() * 1.6, rot: rand() * 3 };
    });
    const palmList = Array.from({ length: palms }, () => {
      const a = rand() * Math.PI * 2;
      const r = radius * (0.35 + rand() * 0.35);
      return { pos: [Math.cos(a) * r, radius * 0.18, Math.sin(a) * r] as const, h: 6 + rand() * 4, lean: (rand() - 0.5) * 0.6, rot: rand() * 6 };
    });
    return { sand: sandGeo, mound: moundGeo, rocks: rockList, palmSpots: palmList };
  }, [radius, seed, palms]);

  return (
    <group>
      <mesh geometry={sand} material={materials.sand} position-y={-2}>
      </mesh>
      {grass && (
        <mesh geometry={mound} material={materials.grass} position-y={0.4} scale={[1, 0.32, 1]}>
        </mesh>
      )}
      {rocks.map((r, i) => (
        <mesh key={i} material={materials.rock} position={r.pos} scale={r.s} rotation-y={r.rot}>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      {models ? (
        <Plants radius={radius} seed={seed} palms={palms} />
      ) : (
        palmSpots.map((p, i) => (
          <group key={i} position={p.pos} rotation-y={p.rot}>
            <Palm height={p.h} lean={p.lean} materials={materials} />
          </group>
        ))
      )}
      {children}
    </group>
  );
}
