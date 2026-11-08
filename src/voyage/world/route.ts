import { CatmullRomCurve3, Vector3 } from 'three';
import { chapters, type ChapterId } from '../../content/story';

/** The ship's course: a gentle S-curve heading toward -z. */
export const route = new CatmullRomCurve3(
  [
    new Vector3(0, 0, 0),
    new Vector3(12, 0, -90),
    new Vector3(-16, 0, -190),
    new Vector3(18, 0, -290),
    new Vector3(-12, 0, -390),
    new Vector3(14, 0, -490),
    new Vector3(0, 0, -590),
    new Vector3(0, 0, -680),
  ],
  false,
  'centripetal',
);

const tangent = new Vector3();
const up = new Vector3(0, 1, 0);

/** Island centre for a chapter: beside the route, at the middle of the chapter. */
function islandPosition(at: number, side: number, radius: number, gap: number) {
  const p = route.getPointAt(at);
  route.getTangentAt(at, tangent);
  const right = new Vector3().crossVectors(tangent, up).normalize();
  return p.addScaledVector(right, side * (radius + gap));
}

export type IslandSpot = { id: ChapterId; position: Vector3; radius: number };

export const islands: IslandSpot[] = chapters
  .filter((c) => c.islandSide !== 0)
  .map((c) => {
    // The first island sits at the start so the voyage begins in harbour.
    const first = c.id === 'spark';
    const at = first ? 0.035 : (c.range[0] + c.range[1]) / 2;
    return { id: c.id, position: islandPosition(at, c.islandSide, c.islandRadius, first ? 16 : 26), radius: c.islandRadius };
  });

export const islandById = Object.fromEntries(islands.map((i) => [i.id, i])) as Record<ChapterId, IslandSpot | undefined>;

/** Ocean surface height. Must match `waveHeight` in shaders/ocean.vert. */
export function waveHeight(x: number, z: number, t: number, storm: number) {
  const a = 0.35 + storm * 1.1;
  return (
    a *
    (Math.sin(x * 0.08 + t * 0.9) * 0.5 +
      Math.sin(z * 0.11 - t * 1.1) * 0.35 +
      Math.sin((x + z) * 0.15 + t * 1.6) * 0.15)
  );
}
