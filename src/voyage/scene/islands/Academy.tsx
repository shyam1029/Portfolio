import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import { AdditiveBlending, type Group, type MeshBasicMaterial } from 'three';
import { INK, toon } from '../toon';
import { IslandBase, defaultIslandMaterials } from './IslandBase';
import { atmosphere } from '../../world/atmosphere';

const mats = defaultIslandMaterials();

/** Chapter 3: a striped lighthouse on a cliff and a small academy hall, at dusk. */
export function Academy({ radius }: { radius: number }) {
  const beam = useRef<Group>(null);
  const beamMat = useRef<MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (beam.current) beam.current.rotation.y = clock.elapsedTime * 0.9;
    // Brighter as the sky darkens.
    if (beamMat.current) beamMat.current.opacity = 0.12 + atmosphere.stars * 0.35 + atmosphere.storm * 0.2;
  });

  const stripes = 6;
  return (
    <IslandBase radius={radius} seed={37} palms={2} materials={mats}>
      <group position={[radius * 0.25, radius * 0.22, -radius * 0.15]}>
        {Array.from({ length: stripes }, (_, i) => (
          <mesh key={i} material={toon(i % 2 ? '#f5f1e6' : '#e8402c')} position-y={i * 2 + 1}>
            <cylinderGeometry args={[1.9 - (i + 1) * 0.14, 1.9 - i * 0.14, 2, 20]} />
            <Outlines thickness={0.05} color={INK} />
          </mesh>
        ))}
        <mesh material={toon('#2b2f45')} position-y={stripes * 2 + 0.2}>
          <cylinderGeometry args={[1.4, 1.4, 0.4, 20]} />
        </mesh>
        <mesh material={toon('#fff2b0', '#f2b632')} position-y={stripes * 2 + 1.2}>
          <cylinderGeometry args={[0.9, 0.9, 1.6, 16]} />
          <Outlines thickness={0.04} color={INK} />
        </mesh>
        <mesh material={toon('#e8402c')} position-y={stripes * 2 + 2.6}>
          <coneGeometry args={[1.3, 1.4, 16]} />
          <Outlines thickness={0.05} color={INK} />
        </mesh>
        <group ref={beam} position-y={stripes * 2 + 1.2}>
          <mesh position-x={9} rotation-z={Math.PI / 2}>
            <coneGeometry args={[2.2, 18, 24, 1, true]} />
            <meshBasicMaterial ref={beamMat} color="#fff2b0" transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      </group>
      {/* academy hall */}
      <group position={[-radius * 0.3, radius * 0.2, radius * 0.2]}>
        <mesh material={toon('#e6dccb')} position-y={2}>
          <boxGeometry args={[7, 4, 4.5]} />
          <Outlines thickness={0.05} color={INK} />
        </mesh>
        <mesh material={toon('#3a4f8f')} position-y={4.9} rotation-y={Math.PI / 2} scale={[1, 1, 1.6]}>
          <coneGeometry args={[3.3, 1.8, 4]} />
          <Outlines thickness={0.05} color={INK} />
        </mesh>
        {[-2.2, 0, 2.2].map((x) => (
          <mesh key={x} material={toon('#f5f1e6')} position={[x, 1.8, 2.4]}>
            <cylinderGeometry args={[0.25, 0.25, 3.6, 8]} />
          </mesh>
        ))}
      </group>
    </IslandBase>
  );
}
