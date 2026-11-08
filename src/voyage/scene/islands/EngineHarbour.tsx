import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry, CanvasTexture, CatmullRomCurve3, ExtrudeGeometry, type Group, Line, LineBasicMaterial, MeshStandardMaterial,
  Path, RepeatWrapping, Shape, SRGBColorSpace, Vector3,
} from 'three';
import { paint, stylise } from '../materials';
import { IslandBase, type IslandMaterials, seeded } from './IslandBase';
import { Particles } from '../fx/Particles';
import { atmosphere } from '../../world/atmosphere';

const mats: IslandMaterials = {
  sand: paint('#7a7c82', { roughness: 0.95 }), grass: paint('#5d6168', { roughness: 0.9 }),
  rock: paint('#4a4d55'), trunk: paint('#4a4d55'), leaf: paint('#4a4d55'),
};

/** Greyscale ribbed-metal texture, tinted per material (shipping containers, warehouse roofs). */
const ribs = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 8;
  const ctx = c.getContext('2d')!;
  for (let x = 0; x < 64; x++) {
    const v = 175 + Math.round(Math.sin((x / 64) * Math.PI * 8) * 55);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, 0, 1, 8);
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  return t;
})();

const ribbedCache = new Map<string, MeshStandardMaterial>();
function ribbed(color: string, repeat = 3) {
  const key = `${color}:${repeat}`;
  let m = ribbedCache.get(key);
  if (!m && ribs) {
    const map = ribs.clone();
    map.repeat.set(repeat, 1);
    map.needsUpdate = true;
    m = new MeshStandardMaterial({ color, map, roughness: 0.55, metalness: 0.35 });
    stylise(m);
    ribbedCache.set(key, m);
  }
  return m!;
}

/** Proper gear: an extruded outline with teeth, spokes cut out and a hub. */
function gearGeometry(teeth: number, radius: number) {
  const s = new Shape();
  const inner = radius * 0.86;
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const r = i % 4 < 2 ? radius : inner;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const holes = 5;
  for (let i = 0; i < holes; i++) {
    const a = (i / holes) * Math.PI * 2;
    const h = new Path();
    h.absarc(Math.cos(a) * radius * 0.52, Math.sin(a) * radius * 0.52, radius * 0.2, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const hub = new Path();
  hub.absarc(0, 0, radius * 0.12, 0, Math.PI * 2, true);
  s.holes.push(hub);
  const g = new ExtrudeGeometry(s, { depth: radius * 0.22, bevelEnabled: true, bevelSize: radius * 0.03, bevelThickness: radius * 0.03, bevelSegments: 1 });
  g.center();
  return g;
}

function Gear({ teeth = 14, radius = 3, speed = 1 }: { teeth?: number; radius?: number; speed?: number }) {
  const ref = useRef<Group>(null);
  const geometry = useMemo(() => gearGeometry(teeth, radius), [teeth, radius]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed;
  });
  return (
    <group ref={ref}>
      <mesh geometry={geometry} material={paint('#b87333', { metalness: 0.8, roughness: 0.35 })} />
    </group>
  );
}

/** Warehouse: brick walls, ribbed gable roof, lit windows and a roller door. */
function Warehouse({ w, d, h, wall }: { w: number; d: number; h: number; wall: string }) {
  const roof = useMemo(() => {
    const s = new Shape().moveTo(-w / 2 - 0.3, 0).lineTo(0, h * 0.35).lineTo(w / 2 + 0.3, 0).lineTo(-w / 2 - 0.3, 0);
    const g = new ExtrudeGeometry(s, { depth: d + 0.6, bevelEnabled: false });
    g.translate(0, 0, -(d + 0.6) / 2);
    return g;
  }, [w, d, h]);
  const windows = Math.floor(d / 2.2);
  return (
    <group>
      <mesh material={paint(wall, { roughness: 0.9 })} position-y={h / 2}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <mesh geometry={roof} material={ribbed('#6f7f86', 6)} position-y={h} />
      {Array.from({ length: windows }, (_, i) => (
        <mesh key={i} material={paint('#ffcf7a', { emissive: '#ff9c3a' })} position={[w / 2 + 0.02, h * 0.62, -d / 2 + 1.4 + i * 2.2]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[1.1, 0.8]} />
        </mesh>
      ))}
      <mesh material={ribbed('#9aa3a8', 5)} position={[0, h * 0.35, d / 2 + 0.02]}>
        <planeGeometry args={[w * 0.45, h * 0.7]} />
      </mesh>
    </group>
  );
}

/** Lattice gantry crane that slowly swings its jib. */
function Crane() {
  const jib = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (jib.current) jib.current.rotation.y = Math.sin(clock.elapsedTime * 0.25) * 0.7;
  });
  const yellow = paint('#e8b21f', { metalness: 0.4, roughness: 0.5 });
  const legs: [number, number][] = [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]];
  return (
    <group>
      {legs.map(([x, z]) => (
        <mesh key={`${x}${z}`} material={yellow} position={[x, 7, z]}>
          <boxGeometry args={[0.35, 14, 0.35]} />
        </mesh>
      ))}
      {[3, 7, 11].map((y) => (
        <mesh key={y} material={yellow} position-y={y}>
          <boxGeometry args={[3.2, 0.25, 3.2]} />
        </mesh>
      ))}
      <group ref={jib} position-y={14.2}>
        <mesh material={yellow} position={[4, 0, 0]}>
          <boxGeometry args={[14, 0.6, 0.6]} />
        </mesh>
        <mesh material={paint('#3b3f46')} position={[-3.2, -0.4, 0]}>
          <boxGeometry args={[2, 1.4, 1.4]} />
        </mesh>
        <mesh material={paint('#2b2f45')} position={[9.5, -4, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 8, 4]} />
        </mesh>
        <mesh material={ribbed('#c4462f', 4)} position={[9.5, -8.6, 0]}>
          <boxGeometry args={[2.6, 1.2, 1.2]} />
        </mesh>
        <mesh material={paint('#ff3b2f', { emissive: '#ff2a1a' })} position={[11, 0.5, 0]}>
          <sphereGeometry args={[0.18, 8, 6]} />
        </mesh>
      </group>
    </group>
  );
}

/** Server racks with blinking status lights. */
function ServerHall() {
  const lights = useMemo(() => {
    const m = new MeshStandardMaterial({ color: '#2ef2ff', emissive: '#2ef2ff', emissiveIntensity: 2 });
    return m;
  }, []);
  useFrame(({ clock }) => {
    lights.emissiveIntensity = 1.4 + Math.sin(clock.elapsedTime * 6) * 0.8;
  });
  return (
    <group>
      <mesh material={paint('#2b2f3a', { metalness: 0.3, roughness: 0.6 })} position-y={2.8}>
        <boxGeometry args={[6, 5.6, 4]} />
      </mesh>
      {Array.from({ length: 3 }, (_, col) =>
        Array.from({ length: 6 }, (_, row) => (
          <mesh key={`${col}-${row}`} material={lights} position={[-1.8 + col * 1.8, 0.9 + row * 0.8, 2.01]}>
            <planeGeometry args={[1.3, 0.12]} />
          </mesh>
        )),
      )}
      <mesh material={paint('#44505a', { metalness: 0.6, roughness: 0.4 })} position={[1.8, 6.4, 0]}>
        <boxGeometry args={[1.6, 1.4, 1.6]} />
      </mesh>
    </group>
  );
}

/** Lightning bolt that strikes the chimney's rod on some flashes. */
function Bolt({ top }: { top: Vector3 }) {
  const line = useMemo(() => {
    const g = new BufferGeometry().setFromPoints(Array.from({ length: 12 }, () => new Vector3()));
    return new Line(g, new LineBasicMaterial({ color: '#e8f4ff', transparent: true }));
  }, []);
  const strike = useRef(0);
  useFrame(() => {
    if (atmosphere.flash > 0.95 && Math.random() < 0.6) strike.current = 1;
    strike.current = Math.max(0, strike.current - 0.08);
    const mat = line.material as LineBasicMaterial;
    mat.opacity = strike.current;
    line.visible = strike.current > 0.02;
    if (strike.current > 0.9) {
      const pos = line.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const k = i / (pos.count - 1);
        pos.setXYZ(i, top.x + (k > 0 && k < 1 ? (Math.random() - 0.5) * 4 * (1 - k) : 0), top.y + (1 - k) * 60, top.z + (k > 0 && k < 1 ? (Math.random() - 0.5) * 4 * (1 - k) : 0));
      }
      pos.needsUpdate = true;
    }
  });
  return <primitive object={line} />;
}

/** Chapter 5: an industrial harbour: the engine room of the web. */
export function EngineHarbour({ radius }: { radius: number }) {
  const ground = radius * 0.2;
  const containers = useMemo(() => {
    const rand = seeded(91);
    const colors = ['#c4462f', '#2f6fa8', '#e0a12a', '#3f8f5a', '#7a4fa0', '#d9d4c9'];
    const out: { p: [number, number, number]; c: string; r: number }[] = [];
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++)
        for (let lvl = 0; lvl < 1 + Math.floor(rand() * 3); lvl++)
          out.push({ p: [col * 2.7, lvl * 2.6 + 1.3, row * 6.3], c: colors[Math.floor(rand() * colors.length)], r: (rand() - 0.5) * 0.04 });
    return out;
  }, []);

  const pipeCurve = useMemo(
    () => new CatmullRomCurve3([new Vector3(-6, 1, -9), new Vector3(-2, 1, -9), new Vector3(0, 3, -8), new Vector3(0, 6, -5), new Vector3(2.5, 6, -2)]),
    [],
  );
  const chimneyTop = useMemo(() => new Vector3(0, 0, 0), []);
  const chimneyBase: [number, number, number] = [-radius * 0.45, ground, -radius * 0.25];

  return (
    <IslandBase radius={radius} seed={67} palms={0} materials={mats} models={false}>
      {/* concrete quay facing the sea lane */}
      <mesh material={paint('#8d8f94', { roughness: 0.95 })} position={[-radius * 0.95, 0.9, 0]}>
        <boxGeometry args={[6, 2.6, radius * 1.4]} />
      </mesh>

      <group position={[radius * 0.15, ground, radius * 0.3]} rotation-y={0.3}>
        <Warehouse w={9} d={12} h={5} wall="#8a3b2e" />
      </group>
      <group position={[radius * 0.35, ground, -radius * 0.35]} rotation-y={-0.4}>
        <Warehouse w={7} d={9} h={4} wall="#3d6b73" />
      </group>

      <group position={[-radius * 0.55, ground + 0.2, radius * 0.25]} rotation-y={0.1}>
        {containers.map((c, i) => (
          <mesh key={i} material={ribbed(c.c, 8)} position={c.p} rotation-y={c.r}>
            <boxGeometry args={[2.5, 2.5, 6]} />
          </mesh>
        ))}
      </group>

      <group position={[-radius * 0.8, ground, -radius * 0.05]}>
        <Crane />
      </group>

      <group position={[radius * 0.05, ground + 6, -radius * 0.05]} rotation-y={0.6}>
        <Gear radius={3.4} speed={0.5} />
        <group position={[5.3, -2.2, 0.3]}>
          <Gear radius={2.1} teeth={9} speed={-0.82} />
        </group>
      </group>

      <group position={[radius * 0.55, ground, radius * 0.05]}>
        <ServerHall />
      </group>

      <mesh position={[radius * 0.2, ground, 0]} material={paint('#6d8a96', { metalness: 0.7, roughness: 0.35 })}>
        <tubeGeometry args={[pipeCurve, 48, 0.5, 10, false]} />
      </mesh>

      {/* chimney with lightning rod and smoke */}
      <group position={chimneyBase}>
        <mesh material={paint('#5b5f68', { roughness: 0.85 })} position-y={8}>
          <cylinderGeometry args={[1.1, 1.6, 16, 16]} />
        </mesh>
        {[5, 11].map((y) => (
          <mesh key={y} material={paint('#e8402c')} position-y={y}>
            <cylinderGeometry args={[1.45 - y * 0.02, 1.5 - y * 0.02, 1, 16]} />
          </mesh>
        ))}
        <mesh material={paint('#2b2f45', { metalness: 0.8, roughness: 0.3 })} position-y={18}>
          <cylinderGeometry args={[0.06, 0.06, 4, 6]} />
        </mesh>
        <Particles count={70} radius={0.8} height={26} speed={0.08} size={6} grow={3} spread={1.2} color="#7b8088" opacity={0.55} soft position-y={16} />
      </group>
      <group position={[-radius * 0.45, 0, -radius * 0.25]}>
        <Bolt top={chimneyTop.set(0, ground + 20, 0)} />
      </group>

      {/* sodium lamps along the quay */}
      {[-1, 0, 1].map((k) => (
        <group key={k} position={[-radius * 0.82, ground, k * radius * 0.45]}>
          <mesh material={paint('#3b3f46')} position-y={3}>
            <cylinderGeometry args={[0.08, 0.1, 6, 6]} />
          </mesh>
          <mesh material={paint('#ffb347', { emissive: '#ff8a1f' })} position-y={6}>
            <sphereGeometry args={[0.28, 10, 8]} />
          </mesh>
          <pointLight color="#ff9c3a" intensity={14} distance={16} position-y={5.8} />
        </group>
      ))}
    </IslandBase>
  );
}
