import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Group, MeshStandardMaterial } from 'three';
import { paint } from '../materials';
import { IslandBase, type IslandMaterials } from './IslandBase';

const mats: IslandMaterials = {
  sand: paint('#7d7f86'), grass: paint('#5a5f68'), rock: paint('#4a4d55'), trunk: paint('#4a4d55'), leaf: paint('#4a4d55'),
};

function Gear({ teeth = 12, radius = 3, speed = 1 }: { teeth?: number; radius?: number; speed?: number }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed;
  });
  return (
    <group ref={ref}>
      <mesh material={paint('#b87333')}>
        <cylinderGeometry args={[radius, radius, 0.8, 24]} />
      </mesh>
      {Array.from({ length: teeth }, (_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        return (
          <mesh key={i} material={paint('#b87333')} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]} rotation-y={-a}>
            <boxGeometry args={[1, 0.8, 0.8]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Server racks with blinking status lights. */
function ServerRack({ position }: { position: [number, number, number] }) {
  const light = useMemo(() => new MeshStandardMaterial({ color: '#2ef2ff', emissive: '#2ef2ff', roughness: 0.8 }), []);
  useFrame(({ clock }) => {
    light.emissiveIntensity = 0.6 + 0.4 * Math.sin(clock.elapsedTime * 5 + position[0]);
  });
  return (
    <group position={position}>
      <mesh material={paint('#2b2f3a')} position-y={3}>
        <boxGeometry args={[2.2, 6, 2.2]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} material={light} position={[0, 0.8 + i * 0.9, 1.11]}>
          <planeGeometry args={[1.6, 0.18]} />
        </mesh>
      ))}
    </group>
  );
}

/** Chapter 5: an industrial harbour of gears, pipes and servers: the engine room of the web. */
export function EngineHarbour({ radius }: { radius: number }) {
  return (
    <IslandBase radius={radius} seed={67} palms={0} materials={mats}>
      <group position={[-radius * 0.25, radius * 0.22 + 4, 0]} rotation-x={Math.PI / 2}>
        <Gear radius={3.4} speed={0.6} />
      </group>
      <group position={[-radius * 0.25 + 6.2, radius * 0.22 + 2.6, 0.2]} rotation-x={Math.PI / 2}>
        <Gear radius={2} teeth={9} speed={-1.02} />
      </group>
      {[-2.5, 0.5, 3.5].map((z, i) => (
        <ServerRack key={z} position={[radius * 0.3, radius * 0.2, z * 1.4 + i * 0.2]} />
      ))}
      {/* pipes */}
      <mesh material={paint('#6d8a96')} position={[0, radius * 0.2 + 1.2, -radius * 0.4]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.6, 0.6, radius * 1.2, 12]} />
      </mesh>
      <mesh material={paint('#6d8a96')} position={[radius * 0.55, radius * 0.2 + 4, -radius * 0.4]}>
        <cylinderGeometry args={[0.6, 0.6, 7, 12]} />
      </mesh>
      {/* chimney with a red band */}
      <mesh material={paint('#4a4d55')} position={[-radius * 0.45, radius * 0.2 + 5, -radius * 0.3]}>
        <cylinderGeometry args={[1, 1.3, 10, 12]} />
      </mesh>
      <mesh material={paint('#e8402c')} position={[-radius * 0.45, radius * 0.2 + 8.5, -radius * 0.3]}>
        <cylinderGeometry args={[1.05, 1.05, 0.8, 12]} />
      </mesh>
    </IslandBase>
  );
}
