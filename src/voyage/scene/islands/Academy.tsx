import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AdditiveBlending, type Group, Mesh, MeshBasicMaterial, type MeshStandardMaterial, Vector3 } from 'three';
import { stylise } from '../materials';
import { IslandBase, defaultIslandMaterials } from './IslandBase';
import { atmosphere } from '../../world/atmosphere';
import { withBase } from '../../../lib/url';

// "Cartoony lighthouse" by Skodvirr, CC-BY-4.0 (credited on the About page).
const LIGHTHOUSE_URL = withBase('models/lighthouse.glb');
useGLTF.preload(LIGHTHOUSE_URL);

const mats = defaultIslandMaterials();
const SCALE = 9;
/** Lamp room centre in model units (the "Yellow" lamp mesh). */
const LAMP = new Vector3(0.38, 2.1, -0.39);
/** Footprint centre of the diorama in model units, so it sits in the middle of the island. */
const CENTRE = new Vector3(0.23, 0, 0.02);

/** Chapter 3: Lighthouse Point, a keeper's cottage, dock and lighthouse at dusk, beam sweeping the sea. */
export function Academy({ radius }: { radius: number }) {
  const beam = useRef<Group>(null);
  const beamMat = useMemo(
    () => new MeshBasicMaterial({ color: '#fff2b0', transparent: true, opacity: 0.25, blending: AdditiveBlending, depthWrite: false }),
    [],
  );
  const { scene } = useGLTF(LIGHTHOUSE_URL);

  const model = useMemo(() => {
    const m = scene.clone();
    m.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const mat = o.material as MeshStandardMaterial;
      if (mat.userData.stylised) return;
      stylise(mat);
      mat.userData.stylised = true;
      // Light the lamp and the windows.
      if (mat.name === 'Yellow') {
        mat.emissive.set('#ffd25a');
        mat.emissiveIntensity = 3;
      }
      if (mat.name.includes('glass')) {
        mat.emissive.set('#ffb35a');
        mat.emissiveIntensity = 0.9;
      }
    });
    return m;
  }, [scene]);

  useFrame(({ clock }) => {
    if (beam.current) beam.current.rotation.y = clock.elapsedTime * 0.9;
    // Brighter as the sky darkens.
    beamMat.opacity = 0.08 + atmosphere.stars * 0.3 + atmosphere.storm * 0.15;
  });

  const lamp = LAMP.clone().sub(CENTRE).multiplyScalar(SCALE);
  return (
    <IslandBase radius={radius} seed={37} palms={3} materials={mats} grass={false}>
      <primitive object={model} position={[-CENTRE.x * SCALE, 0.45, -CENTRE.z * SCALE]} scale={SCALE} />
      <group position={[lamp.x, lamp.y + 0.45, lamp.z]}>
        <pointLight color="#ffd27a" intensity={40} distance={60} />
        <group ref={beam}>
          {/* Two opposing soft cones, like a rotating Fresnel lens. */}
          {[1, -1].map((dir) => (
            <mesh key={dir} position-x={dir * 11} rotation-z={(dir * Math.PI) / 2} material={beamMat}>
              <coneGeometry args={[2.6, 22, 24, 1, true]} />
            </mesh>
          ))}
        </group>
      </group>
    </IslandBase>
  );
}
