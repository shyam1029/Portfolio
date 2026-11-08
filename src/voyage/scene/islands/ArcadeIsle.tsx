import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BoxGeometry, Color, type Group, InstancedMesh, type Mesh, MeshBasicMaterial, Object3D, Vector3 } from 'three';
import { paint } from '../materials';
import { IslandBase, defaultIslandMaterials, seeded } from './IslandBase';
import { games } from '../../../content/story';
import { bottleLabels } from '../../world/bottleLabels';

import { atmosphere } from '../../world/atmosphere';
import { waveHeight } from '../../world/route';
import { MeshStandardMaterial } from 'three';

const mats = defaultIslandMaterials();
const BLOCK_COLORS = ['#e8402c', '#f2b632', '#3aa0ff', '#5cbf5a', '#9b5de5', '#ff7ab6'];

/** A stepped pyramid of bright blocks, like a level from an old platformer. */
function BlockTower() {
  const mesh = useRef<InstancedMesh>(null);
  const blocks = useMemo(() => {
    const rand = seeded(5);
    const list: { p: [number, number, number]; c: string }[] = [];
    for (let layer = 0; layer < 5; layer++) {
      const n = 5 - layer;
      for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
        if (rand() < 0.15 && layer > 0) continue;
        list.push({ p: [x - n / 2 + 0.5, layer + 0.5, z - n / 2 + 0.5], c: BLOCK_COLORS[Math.floor(rand() * BLOCK_COLORS.length)] });
      }
    }
    return list;
  }, []);
  const geometry = useMemo(() => new BoxGeometry(0.96, 0.96, 0.96), []);
  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.8 }), []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const d = new Object3D();
    const c = new Color();
    blocks.forEach((b, i) => {
      d.position.set(...b.p);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
      m.setColorAt(i, c.set(b.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [blocks]);

  return (
    <instancedMesh ref={mesh} args={[geometry, material, blocks.length]} scale={2.2}>
    </instancedMesh>
  );
}

function Coins() {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    group.current?.children.forEach((c, i) => {
      c.rotation.y = clock.elapsedTime * 2 + i;
      c.position.y = 14 + Math.sin(clock.elapsedTime * 1.5 + i) * 0.6;
    });
  });
  return (
    <group ref={group}>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} material={paint('#f2b632', '#6b4a00')} position={[Math.cos(a) * 7, 14, Math.sin(a) * 7]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.9, 0.9, 0.2, 20]} />
          </mesh>
        );
      })}
    </group>
  );
}

const labelAnchor = new Vector3();

/** A message bottle bobbing in the water; clicking it opens one of the games. */
function Bottle({ game, world, index }: { game: (typeof games)[number]; world: Vector3; index: number }) {
  const ref = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const [hover, setHover] = useState(false);
  const ringMat = useMemo(
    () => new MeshBasicMaterial({ color: '#9ffcf0', transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false }),
    [],
  );
  const phase = useMemo(() => world.x * 0.7, [world]);

  useFrame(({ clock, camera, size }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    // Publish where this bottle's name tag should sit on screen (the DOM labels read it).
    g.getWorldPosition(labelAnchor);
    labelAnchor.y += 3.2;
    labelAnchor.project(camera);
    const label = bottleLabels[index];
    label.x = (labelAnchor.x * 0.5 + 0.5) * size.width;
    label.y = (-labelAnchor.y * 0.5 + 0.5) * size.height;
    label.onScreen = labelAnchor.z < 1 && Math.abs(labelAnchor.x) < 1.05 && Math.abs(labelAnchor.y) < 1.05;
    label.hover = hover;
    // Bottles live in island-local space; sample waves at their world position.
    g.position.y = waveHeight(world.x, world.z, t, atmosphere.storm) + 0.7;
    g.rotation.z = 0.5 + Math.sin(t * 1.3 + phase) * 0.25;
    g.rotation.x = Math.cos(t * 1.1 + phase) * 0.2;
    ringMat.opacity = (hover ? 0.8 : 0.35) + Math.sin(t * 2.5 + phase) * 0.15;
    if (ring.current) ring.current.position.y = g.position.y - 0.85;
    const s = hover ? 1.75 : 1.45;
    g.scale.lerp(new Vector3(s, s, s), 0.2);
  });

  return (
    <>
    {/* soft glowing ring lying flat on the water, so each bottle is easy to spot */}
    <mesh ref={ring} rotation-x={-Math.PI / 2} material={ringMat}>
      <ringGeometry args={[1.8, 2.9, 40]} />
    </mesh>
    <group
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        window.open(game.url, '_blank', 'noopener');
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = '';
      }}
    >
      <mesh material={paint('#7fe0d0')}>
        <capsuleGeometry args={[0.55, 1.3, 6, 12]} />
      </mesh>
      <mesh material={paint('#7fe0d0')} position-y={1.25}>
        <cylinderGeometry args={[0.22, 0.3, 0.6, 10]} />
      </mesh>
      <mesh material={paint('#a8754a')} position-y={1.62}>
        <cylinderGeometry args={[0.24, 0.24, 0.25, 10]} />
      </mesh>
      <mesh material={paint('#f3e6c9')} position-y={0.05}>
        <cylinderGeometry args={[0.3, 0.3, 1.1, 10]} />
      </mesh>
      {/* invisible, larger hit area so the bottle is easy to click */}
      <mesh visible={false}>
        <sphereGeometry args={[1.6, 8, 8]} />
      </mesh>
    </group>
    </>
  );
}

/** Chapter 2: block towers, spinning coins, and the three playable games in bottles. */
export function ArcadeIsle({ radius, worldPosition, towardRoute }: { radius: number; worldPosition: Vector3; towardRoute: Vector3 }) {
  const bottles = useMemo(() => {
    const side = new Vector3(-towardRoute.z, 0, towardRoute.x);
    return games.map((game, i) => {
      // On an arc just off the shore facing the sea lane, so the three never line up behind each
      // other from the camera's point of view (a straight row along the route did).
      const angle = (i - 1) * 0.5;
      const local = towardRoute
        .clone()
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(side, Math.sin(angle))
        .multiplyScalar(radius + 6);
      return { game, local, world: local.clone().add(worldPosition) };
    });
  }, [radius, worldPosition, towardRoute]);

  return (
    <IslandBase radius={radius} seed={23} palms={4} materials={mats}>
      <group position={[0, radius * 0.2, 0]}>
        <BlockTower />
      </group>
      <Coins />
      {bottles.map((b, i) => (
        <group key={b.game.title} position={[b.local.x, 0, b.local.z]}>
          <Bottle game={b.game} world={b.world} index={i} />
        </group>
      ))}
    </IslandBase>
  );
}
