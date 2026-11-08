import { useFrame } from '@react-three/fiber';
import { MathUtils, Vector3 } from 'three';
import { useVoyage } from '../world/store';
import { chapterAt, sampleCamera } from '../world/atmosphere';
import { islandById } from '../world/route';
import { shipState } from './shipState';

const desired = new Vector3();
const look = new Vector3();
const lookTarget = new Vector3();
const right = new Vector3();
const UP = new Vector3(0, 1, 0);

/** Cinematic follow camera: framing blends per chapter and swings toward each island. */
export function CameraRig() {
  useFrame(({ camera }, delta) => {
    const t = useVoyage.getState().progress;
    const { offset, lookAtIsland } = sampleCamera(t);
    const { position, forward } = shipState;
    right.crossVectors(forward, UP).normalize();

    desired
      .copy(position)
      .addScaledVector(right, offset[0])
      .addScaledVector(UP, offset[1])
      .addScaledVector(forward, -offset[2]);

    lookTarget.copy(position).addScaledVector(forward, 22).addScaledVector(UP, 2);
    const chapter = chapterAt(t);
    const island = islandById[chapter.id];
    if (island) {
      // Strongest in the middle of the chapter, so each island gets its moment.
      const local = (t - chapter.range[0]) / (chapter.range[1] - chapter.range[0]);
      const l = MathUtils.clamp(local, 0, 1);
      // The voyage opens in harbour (full weight at the start); other islands peak mid-chapter.
      // Plateau rather than a peak, so each island stays framed for most of its chapter.
      const w = lookAtIsland * (chapter.id === 'spark' ? 1 - MathUtils.smoothstep(l, 0.3, 1) : Math.min(1, Math.sin(Math.PI * l) * 1.6));
      lookTarget.lerp(look.copy(island.position).setY(6), w);
    }

    const k = 1 - Math.exp(-delta * 3);
    camera.position.lerp(desired, k);
    look.copy(camera.userData.look ?? lookTarget).lerp(lookTarget, k);
    camera.userData.look = look.clone();
    camera.lookAt(look);
  });
  return null;
}
