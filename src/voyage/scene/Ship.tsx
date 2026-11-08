import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  CanvasTexture, DoubleSide, Group, MathUtils, Mesh, MeshStandardMaterial, NearestFilter, PlaneGeometry, SRGBColorSpace, Vector3,
} from 'three';
import { stylise } from './materials';
import { Captain } from './Captain';
import { shipState } from './shipState';
import { atmosphere, uniforms } from '../world/atmosphere';
import { route, waveHeight } from '../world/route';
import { useVoyage } from '../world/store';
import { withBase } from '../../lib/url';

// "Stylized Pirate Ship" by Maksim Batyrev, CC-BY-4.0 (credited on the About page).
const SHIP_URL = withBase('models/ship.glb');
const SHIP_SCALE = 1.35;
useGLTF.preload(SHIP_URL);

/** Original emblem: an 8-bit skull over crossed bones (a nod to the games that started it all). */
function flagTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 40;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#16161f';
  ctx.fillRect(0, 0, 64, 40);
  ctx.fillStyle = '#f5f1e6';
  const px = (x: number, y: number, w = 1, h = 1) => ctx.fillRect(x * 2, y * 2, w * 2, h * 2);
  // crossed bones
  for (let i = 0; i < 14; i++) { px(9 + i, 5 + i * 0.75); px(23 - i, 5 + i * 0.75); }
  px(8, 4, 2, 2); px(22, 4, 2, 2); px(8, 15, 2, 2); px(22, 15, 2, 2);
  // skull
  px(12, 4, 8, 7); px(11, 5, 10, 5); px(13, 11, 6, 2);
  ctx.fillStyle = '#16161f';
  px(13, 6, 2, 2); px(17, 6, 2, 2); px(15, 9, 2, 1); px(14, 12); px(16, 12); px(18, 12);
  const tex = new CanvasTexture(c);
  tex.magFilter = NearestFilter;
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

const tangent = new Vector3();
const target = new Vector3();

export function Ship() {
  const group = useRef<Group>(null);
  const flag = useRef<Mesh>(null);
  const { scene } = useGLTF(SHIP_URL);

  const model = useMemo(() => {
    const m = scene.clone();
    m.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      // Our own flag replaces the model's main flag.
      if (o.name.startsWith('StylShip_MainFlag')) o.visible = false;
      const mat = o.material as MeshStandardMaterial;
      if (!mat.userData.stylised) {
        stylise(mat);
        mat.userData.stylised = true;
      }
      if (mat.name.includes('SailsRope')) mat.emissiveIntensity = 0.6; // glowing sail trim, softer
    });
    return m;
  }, [scene]);

  const flagGeo = useMemo(() => new PlaneGeometry(1.6, 1, 12, 6).translate(0.8, 0, 0), []);
  const flagMat = useMemo(() => {
    const m = new MeshStandardMaterial({ map: flagTexture(), roughness: 0.9, side: DoubleSide });
    stylise(m);
    return m;
  }, []);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const at = MathUtils.clamp(useVoyage.getState().progress, 0, 1);

    route.getPointAt(at, target);
    route.getTangentAt(at, tangent);
    const storm = atmosphere.storm;

    // Float on the same waves the ocean shader draws.
    const h = waveHeight(target.x, target.z, t, storm);
    const hFront = waveHeight(target.x + tangent.x * 3, target.z + tangent.z * 3, t, storm);
    const hSide = waveHeight(target.x + tangent.z * 1.5, target.z - tangent.x * 1.5, t, storm);
    g.position.set(target.x, h - 0.2, target.z);

    const heading = Math.atan2(-tangent.x, -tangent.z);
    g.rotation.y = MathUtils.damp(g.rotation.y, heading, 4, delta);
    g.rotation.x = MathUtils.damp(g.rotation.x, (hFront - h) * 0.25, 3, delta);
    g.rotation.z = MathUtils.damp(g.rotation.z, (hSide - h) * 0.35 + Math.sin(t * 0.8) * (0.02 + storm * 0.06), 3, delta);

    shipState.position.copy(g.position);
    shipState.forward.copy(tangent).setY(0).normalize();
    uniforms.uShipPos.value.copy(g.position);
    uniforms.uShipDir.value.copy(shipState.forward);

    // Waving flag: travelling sine along its length, pinned at the pole.
    const f = flag.current;
    if (f) {
      const pos = f.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i); // 0 at the pole
        pos.setZ(i, Math.sin(x * 3.2 - t * (6 + storm * 6)) * 0.18 * x);
      }
      pos.needsUpdate = true;
      f.geometry.computeVertexNormals();
    }
  });

  return (
    <group ref={group}>
      {/* Model's bow points along -x; turn it to face -z (the direction of travel). */}
      <primitive object={model} rotation-y={-Math.PI / 2} scale={SHIP_SCALE} />
      {/* Our flag at the top of the main mast, streaming aft. */}
      <mesh ref={flag} geometry={flagGeo} material={flagMat} position={[0, 6.0 * SHIP_SCALE, -0.83 * SHIP_SCALE]} rotation-y={-Math.PI / 2} />
      {/* Captain at the wheel (model wheel ≈ x 1.72, deck ≈ y 1.58 before turning and scaling). */}
      <Captain position={[0, 1.58 * SHIP_SCALE, 2.25 * SHIP_SCALE]} scale={0.75} />
    </group>
  );
}
