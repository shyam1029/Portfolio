import { Outlines } from '@react-three/drei';
import { INK, toon } from '../toon';
import { IslandBase, defaultIslandMaterials } from './IslandBase';

const mats = defaultIslandMaterials();

function House({ position, color, roof }: { position: [number, number, number]; color: string; roof: string }) {
  return (
    <group position={position}>
      <mesh material={toon(color)} position-y={1.4}>
        <boxGeometry args={[3, 2.8, 3]} />
        <Outlines thickness={0.05} color={INK} />
      </mesh>
      <mesh material={toon(roof)} position-y={3.6} rotation-y={Math.PI / 4}>
        <coneGeometry args={[2.6, 1.8, 4]} />
        <Outlines thickness={0.05} color={INK} />
      </mesh>
      {/* lit window */}
      <mesh material={toon('#ffd27a', '#ffb347')} position={[0, 1.5, 1.52]}>
        <planeGeometry args={[0.8, 0.8]} />
      </mesh>
    </group>
  );
}

/** Chapter 1: a sleepy harbour village at night, lanterns glowing. */
export function SparkHarbour({ radius }: { radius: number }) {
  return (
    <IslandBase radius={radius} seed={11} palms={2} materials={mats}>
      <House position={[-4, 2, -2]} color="#e9d7b5" roof="#c2452f" />
      <House position={[3, 2, -5]} color="#cfe0e8" roof="#2f5f8f" />
      <House position={[1, 2, 4]} color="#f0c9a0" roof="#7a3e8f" />
      {/* dock reaching toward the route */}
      <group position={[-radius - 3, 0.6, 0]}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} material={toon('#8a5a34')} position={[-i * 1.2 + 4, 0, 0]}>
            <boxGeometry args={[1.05, 0.25, 3]} />
          </mesh>
        ))}
        {[-3, 1, 5].map((x) => (
          <group key={x} position={[x - 1, 0, 1.6]}>
            <mesh material={toon('#5e3a22')} position-y={1}>
              <cylinderGeometry args={[0.1, 0.1, 2.4, 6]} />
            </mesh>
            <mesh material={toon('#ffd27a', '#ffb347')} position-y={2.3}>
              <sphereGeometry args={[0.28, 10, 8]} />
            </mesh>
            <pointLight color="#ffb347" intensity={6} distance={10} position-y={2.3} />
          </group>
        ))}
      </group>
    </IslandBase>
  );
}
