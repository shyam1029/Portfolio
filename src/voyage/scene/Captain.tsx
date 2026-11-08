import { useRef } from 'react';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import type { Group } from 'three';
import { paint } from './materials';
import { atmosphere } from '../world/atmosphere';

/**
 * Placeholder chibi captain until the VRoid avatar (public/models/captain.vrm) is ready.
 * Navy tricorn and red coat; breathes, sways with the sea, and braces at the wheel in the storm.
 */
export function Captain(props: ThreeElements['group']) {
  const body = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const storm = atmosphere.storm;
    if (body.current) {
      body.current.position.y = Math.sin(t * 2) * 0.03;
      body.current.rotation.z = Math.sin(t * 0.8) * 0.05 * (1 - storm);
    }
    // Arms reach for the wheel as the storm builds.
    const reach = -0.4 - storm * 0.9;
    if (armL.current) armL.current.rotation.x = reach + Math.sin(t * 2.2) * 0.05;
    if (armR.current) armR.current.rotation.x = reach + Math.cos(t * 2.2) * 0.05;
  });

  return (
    <group {...props} rotation-y={Math.PI}>
      <group ref={body}>
        {/* legs */}
        <mesh material={paint('#2b2f45')} position={[-0.14, 0.3, 0]}>
          <capsuleGeometry args={[0.1, 0.35, 4, 8]} />
        </mesh>
        <mesh material={paint('#2b2f45')} position={[0.14, 0.3, 0]}>
          <capsuleGeometry args={[0.1, 0.35, 4, 8]} />
        </mesh>
        {/* coat */}
        <mesh material={paint('#d23a2a')} position={[0, 0.85, 0]}>
          <capsuleGeometry args={[0.28, 0.45, 6, 12]} />
        </mesh>
        {/* arms */}
        <group ref={armL} position={[-0.36, 1.05, 0]}>
          <mesh material={paint('#d23a2a')} position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.08, 0.32, 4, 8]} />
          </mesh>
        </group>
        <group ref={armR} position={[0.36, 1.05, 0]}>
          <mesh material={paint('#d23a2a')} position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.08, 0.32, 4, 8]} />
          </mesh>
        </group>
        {/* head: big chibi proportions */}
        <mesh material={paint('#f2c9a0')} position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.32, 20, 16]} />
        </mesh>
        <mesh material={paint('#1d1a22')} position={[0, 1.66, 0.05]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.33, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {/* navy tricorn hat */}
        <mesh material={paint('#1f2a52')} position={[0, 1.86, 0]} scale={[1, 0.25, 1]}>
          <cylinderGeometry args={[0.5, 0.5, 0.3, 3]} />
        </mesh>
        <mesh material={paint('#1f2a52')} position={[0, 1.98, 0]}>
          <cylinderGeometry args={[0.22, 0.28, 0.26, 16]} />
        </mesh>
        <mesh material={paint('#f2b632')} position={[0, 1.87, 0.0]} scale={[1.01, 0.06, 1.01]}>
          <cylinderGeometry args={[0.5, 0.5, 0.3, 3]} />
        </mesh>
      </group>
    </group>
  );
}
