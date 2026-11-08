import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AdditiveBlending, Color, DoubleSide, type Group, Mesh, type MeshStandardMaterial, ShaderMaterial, Vector3 } from 'three';
import beamVert from '../../shaders/beam.vert?raw';
import beamFrag from '../../shaders/beam.frag?raw';
import haloVert from '../../shaders/halo.vert?raw';
import haloFrag from '../../shaders/halo.frag?raw';
import { uniforms } from '../../world/atmosphere';
import { stylise } from '../materials';
import { IslandBase, defaultIslandMaterials } from './IslandBase';
import { atmosphere } from '../../world/atmosphere';
import { withBase } from '../../../lib/url';

// "Cartoony lighthouse" by Skodvirr, CC-BY-4.0 (credited on the About page).
const LIGHTHOUSE_URL = withBase('models/lighthouse.glb');
useGLTF.preload(LIGHTHOUSE_URL);

const mats = defaultIslandMaterials();
const SCALE = 9;
const BEAM_LENGTH = 70;
const lampWorld = new Vector3();
const toCamera = new Vector3();
const beamDir = new Vector3();
/** Lamp room centre in model units (the "Yellow" lamp mesh). */
const LAMP = new Vector3(0.38, 2.1, -0.39);
/** Footprint centre of the diorama in model units, so it sits in the middle of the island. */
const CENTRE = new Vector3(0.23, 0, 0.02);

/** Chapter 3: Lighthouse Point, a keeper's cottage, dock and lighthouse at dusk, beam sweeping the sea. */
export function Academy({ radius }: { radius: number }) {
  const beam = useRef<Group>(null);
  const beamMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: beamVert,
        fragmentShader: beamFrag,
        uniforms: { uTime: uniforms.uTime, uOpacity: { value: 0.5 }, uColor: { value: new Color('#ffe9a8') }, uLength: { value: BEAM_LENGTH } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    [],
  );
  const haloMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: haloVert,
        fragmentShader: haloFrag,
        uniforms: { uIntensity: { value: 1 }, uColor: { value: new Color('#ffd98a') }, uSize: { value: 9 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
      }),
    [],
  );
  const lampRef = useRef<Group>(null);
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

  useFrame(({ clock, camera }) => {
    const b = beam.current;
    if (!b) return;
    b.rotation.y = clock.elapsedTime * 0.7;
    // Brighter as the sky darkens; still faintly visible in daylight haze.
    const dusk = 0.25 + atmosphere.stars * 0.9 + atmosphere.storm * 0.5 + (1 - Math.min(atmosphere.sunIntensity, 2) / 2) * 0.4;
    beamMat.uniforms.uOpacity.value = Math.min(dusk, 1.1);
    // The lamp flares when one of the two beams swings toward the camera.
    if (lampRef.current) {
      lampRef.current.getWorldPosition(lampWorld);
      toCamera.subVectors(camera.position, lampWorld).setY(0).normalize();
      beamDir.set(Math.cos(b.rotation.y), 0, -Math.sin(b.rotation.y));
      const facing = Math.abs(beamDir.dot(toCamera));
      haloMat.uniforms.uIntensity.value = (0.7 + Math.pow(facing, 20) * 3) * Math.min(dusk + 0.3, 1.3);
    }
  });

  const lamp = LAMP.clone().sub(CENTRE).multiplyScalar(SCALE);
  return (
    <IslandBase radius={radius} seed={37} palms={3} materials={mats} grass={false}>
      <primitive object={model} position={[-CENTRE.x * SCALE, 0.45, -CENTRE.z * SCALE]} scale={SCALE} />
      <group position={[lamp.x, lamp.y + 0.45, lamp.z]}>
        <pointLight color="#ffd27a" intensity={60} distance={70} decay={1.6} />
        <group ref={lampRef}>
          <mesh material={haloMat} renderOrder={5}>
            <planeGeometry args={[1, 1]} />
          </mesh>
        </group>
        <group ref={beam}>
          {/* Two opposing soft light cones, like a rotating Fresnel lens; the narrow end sits in the lamp. */}
          {[1, -1].map((dir) => (
            <mesh key={dir} position-x={dir * (BEAM_LENGTH / 2 + 0.4)} rotation-z={(dir * Math.PI) / 2} material={beamMat}>
              <coneGeometry args={[4.5, BEAM_LENGTH, 32, 1, true]} />
            </mesh>
          ))}
        </group>
      </group>
    </IslandBase>
  );
}
