import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import {
  CanvasTexture, DoubleSide, ExtrudeGeometry, Group, MathUtils, Mesh, MeshToonMaterial, NearestFilter,
  PlaneGeometry, Shape, ShapeGeometry, SRGBColorSpace, Vector3,
} from 'three';
import { INK, toon, toonGradient } from './toon';
import { Captain } from './Captain';
import { shipState } from './shipState';
import { atmosphere } from '../world/atmosphere';
import { route, waveHeight } from '../world/route';
import { useVoyage } from '../world/store';

const WOOD = '#8a5a34';
const WOOD_DARK = '#5e3a22';
const TRIM = '#e8402c';
const LINEN = '#f3e6c9';

/** Plan-view outline of the hull: pointed bow at +y, flat stern at -y. */
function hullShape(scale = 1) {
  const s = new Shape();
  s.moveTo(-1.5 * scale, -4 * scale);
  s.lineTo(1.5 * scale, -4 * scale);
  s.bezierCurveTo(2.1 * scale, -1.5 * scale, 2.0 * scale, 1.8 * scale, 0, 5.2 * scale);
  s.bezierCurveTo(-2.0 * scale, 1.8 * scale, -2.1 * scale, -1.5 * scale, -1.5 * scale, -4 * scale);
  return s;
}

function hullGeometry() {
  const height = 1.9;
  const g = new ExtrudeGeometry(hullShape(), { depth: height, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2, curveSegments: 24 });
  // Extruded along +z; stand it up so the extrusion becomes height (y), bow toward -z.
  g.rotateX(Math.PI / 2);
  g.rotateY(Math.PI);
  g.translate(0, height, 0);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = MathUtils.clamp(y / height, 0, 1);
    pos.setX(i, pos.getX(i) * MathUtils.lerp(0.35, 1, Math.sqrt(k))); // V-shaped keel
    const bow = MathUtils.clamp(-z / 5, 0, 1);
    pos.setY(i, y + bow * bow * 0.9 * k); // sheer: the bow rises
  }
  g.computeVertexNormals();
  return g;
}

function sailGeometry(w: number, h: number) {
  const g = new PlaneGeometry(w, h, 10, 10);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / w + 0.5;
    const v = pos.getY(i) / h + 0.5;
    pos.setZ(i, -Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * 0.7); // billow forward
  }
  g.computeVertexNormals();
  return g;
}

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
  const hull = useMemo(hullGeometry, []);
  const deck = useMemo(() => {
    const g = new ShapeGeometry(hullShape(0.9), 24);
    g.rotateX(-Math.PI / 2); // lie flat, bow toward -z like the hull
    return g;
  }, []);
  const mainSail = useMemo(() => sailGeometry(4.6, 3.6), []);
  const topSail = useMemo(() => sailGeometry(3.4, 2.2), []);
  const flagGeo = useMemo(() => new PlaneGeometry(1.6, 1, 12, 6), []);
  const flagMat = useMemo(
    () => new MeshToonMaterial({ map: flagTexture(), gradientMap: toonGradient, side: DoubleSide }),
    [],
  );
  const sailMat = useMemo(() => new MeshToonMaterial({ color: LINEN, gradientMap: toonGradient, side: DoubleSide }), []);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const progress = useVoyage.getState().progress;
    const at = MathUtils.clamp(progress, 0, 1);

    route.getPointAt(at, target);
    route.getTangentAt(at, tangent);
    const storm = atmosphere.storm;

    // Float on the same waves the ocean shader draws.
    const h = waveHeight(target.x, target.z, t, storm);
    const hFront = waveHeight(target.x + tangent.x * 3, target.z + tangent.z * 3, t, storm);
    const hSide = waveHeight(target.x + tangent.z * 1.5, target.z - tangent.x * 1.5, t, storm);
    g.position.set(target.x, h * 0.85 - 0.35, target.z);

    const heading = Math.atan2(-tangent.x, -tangent.z);
    g.rotation.y = MathUtils.damp(g.rotation.y, heading, 4, delta);
    g.rotation.x = MathUtils.damp(g.rotation.x, (hFront - h) * 0.25, 3, delta);
    g.rotation.z = MathUtils.damp(g.rotation.z, (hSide - h) * 0.35 + Math.sin(t * 0.8) * (0.02 + storm * 0.06), 3, delta);

    shipState.position.copy(g.position);
    shipState.forward.copy(tangent).setY(0).normalize();

    // Waving flag: travelling sine along its length, pinned at the pole.
    const f = flag.current;
    if (f) {
      const pos = f.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) + 0.8; // 0 at the pole
        pos.setZ(i, Math.sin(x * 3.2 - t * (6 + storm * 6)) * 0.18 * x);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={hull} material={toon(WOOD)}>
        <Outlines thickness={0.06} color={INK} />
      </mesh>
      {/* red trim band */}
      <mesh geometry={hull} material={toon(TRIM)} scale={[1.02, 0.18, 1.02]} position-y={1.75} />
      <mesh geometry={deck} material={toon('#c08a57')} position-y={1.95} />
      {/* stern cabin */}
      <mesh material={toon(WOOD_DARK)} position={[0, 2.6, 3.0]}>
        <boxGeometry args={[2.4, 1.3, 1.6]} />
        <Outlines thickness={0.05} color={INK} />
      </mesh>
      <mesh material={toon(TRIM)} position={[0, 3.3, 3.0]}>
        <boxGeometry args={[2.6, 0.15, 1.8]} />
      </mesh>
      {/* mast, yards, crow's nest */}
      <mesh material={toon(WOOD_DARK)} position={[0, 6.2, -0.6]}>
        <cylinderGeometry args={[0.13, 0.18, 8.6, 10]} />
      </mesh>
      <mesh material={toon(WOOD_DARK)} position={[0, 7.6, -0.6]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.07, 0.07, 5, 8]} />
      </mesh>
      <mesh material={toon(WOOD_DARK)} position={[0, 4.0, -0.6]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.07, 0.07, 5.2, 8]} />
      </mesh>
      <mesh material={toon(WOOD)} position={[0, 9.4, -0.6]}>
        <cylinderGeometry args={[0.55, 0.45, 0.5, 12, 1, true]} />
      </mesh>
      <mesh geometry={mainSail} material={sailMat} position={[0, 5.8, -0.75]}>
        <Outlines thickness={0.04} color={INK} />
      </mesh>
      <mesh geometry={topSail} material={sailMat} position={[0, 8.6, -0.7]} scale={0.8} />
      {/* bowsprit */}
      <mesh material={toon(WOOD_DARK)} position={[0, 2.9, -6.1]} rotation-x={-Math.PI / 2.6}>
        <cylinderGeometry args={[0.06, 0.1, 3.2, 8]} />
      </mesh>
      <mesh ref={flag} geometry={flagGeo} material={flagMat} position={[0.8, 10.5, -0.6]} />
      {/* lantern on the stern: glows in the night chapters */}
      <mesh position={[0, 3.6, 4.0]} material={toon('#ffd27a', '#ffb347')}>
        <sphereGeometry args={[0.22, 12, 8]} />
      </mesh>
      {/* helm */}
      <group position={[0, 2.5, 1.7]}>
        <mesh material={toon(WOOD_DARK)}>
          <torusGeometry args={[0.45, 0.06, 6, 16]} />
        </mesh>
        <mesh material={toon(WOOD_DARK)} rotation-z={Math.PI / 4}>
          <boxGeometry args={[1.1, 0.06, 0.06]} />
        </mesh>
        <mesh material={toon(WOOD_DARK)} rotation-z={-Math.PI / 4}>
          <boxGeometry args={[1.1, 0.06, 0.06]} />
        </mesh>
      </group>
      <Captain position={[0, 1.95, 2.35]} />
    </group>
  );
}
