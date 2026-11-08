import { Color, MathUtils, Vector3 } from 'three';
import { chapters, type CameraFraming, type Palette } from '../../content/story';

/**
 * Live, blended atmosphere. `Atmosphere` (scene/Atmosphere.tsx) samples the story palettes
 * every frame and writes into these objects; materials hold references to them as uniforms.
 */
export const atmosphere = {
  skyTop: new Color(),
  skyBottom: new Color(),
  sun: new Color(),
  sunIntensity: 1,
  sunDir: new Vector3(0, 1, 0),
  ambient: new Color(),
  ambientIntensity: 1,
  waterDeep: new Color(),
  waterShallow: new Color(),
  foam: new Color(),
  cloud: new Color(),
  stars: 0,
  storm: 0,
  flash: 0, // lightning, 0..1
};

export const uniforms = {
  uTime: { value: 0 },
  uSkyTop: { value: atmosphere.skyTop },
  uSkyBottom: { value: atmosphere.skyBottom },
  uSun: { value: atmosphere.sun },
  uSunDir: { value: atmosphere.sunDir },
  uWaterDeep: { value: atmosphere.waterDeep },
  uWaterShallow: { value: atmosphere.waterShallow },
  uFoam: { value: atmosphere.foam },
  uSunIntensity: { value: 1 },
  uAmbient: { value: atmosphere.ambient },
  uAmbientIntensity: { value: 1 },
  uCloud: { value: atmosphere.cloud },
  uShipPos: { value: new Vector3() },
  uShipDir: { value: new Vector3(0, 0, -1) },
  uStars: { value: 0 },
  uStorm: { value: 0 },
  uFlash: { value: 0 },
};

// Keyframes sit at the middle of each chapter; between them everything blends.
const keys = chapters.map((c) => ({ at: (c.range[0] + c.range[1]) / 2, palette: c.palette, camera: c.camera }));

/** Index of the key before `t` and the blend factor toward the next one (smoothed). */
export function keyBlend(t: number) {
  if (t <= keys[0].at) return { i: 0, j: 0, k: 0 };
  for (let i = 0; i < keys.length - 1; i++) {
    if (t <= keys[i + 1].at) {
      const k = (t - keys[i].at) / (keys[i + 1].at - keys[i].at);
      return { i, j: i + 1, k: MathUtils.smootherstep(k, 0, 1) };
    }
  }
  const last = keys.length - 1;
  return { i: last, j: last, k: 0 };
}

const a = new Color();
const b = new Color();
const lerpHex = (out: Color, x: string, y: string, k: number) =>
  out.copy(a.set(x)).lerp(b.set(y), k);

const va = new Vector3();
const vb = new Vector3();

export function sampleAtmosphere(t: number) {
  const { i, j, k } = keyBlend(t);
  const p: Palette = keys[i].palette;
  const q: Palette = keys[j].palette;
  const at = atmosphere;
  lerpHex(at.skyTop, p.skyTop, q.skyTop, k);
  lerpHex(at.skyBottom, p.skyBottom, q.skyBottom, k);
  lerpHex(at.sun, p.sun, q.sun, k);
  lerpHex(at.ambient, p.ambient, q.ambient, k);
  lerpHex(at.waterDeep, p.waterDeep, q.waterDeep, k);
  lerpHex(at.waterShallow, p.waterShallow, q.waterShallow, k);
  lerpHex(at.foam, p.foam, q.foam, k);
  lerpHex(at.cloud, p.cloud, q.cloud, k);
  at.sunDir.copy(va.set(...p.sunDir).normalize().lerp(vb.set(...q.sunDir).normalize(), k)).normalize();
  at.sunIntensity = MathUtils.lerp(p.sunIntensity, q.sunIntensity, k);
  at.ambientIntensity = MathUtils.lerp(p.ambientIntensity, q.ambientIntensity, k);
  at.stars = MathUtils.lerp(p.stars, q.stars, k);
  at.storm = MathUtils.lerp(p.storm, q.storm, k);
}

export function sampleCamera(t: number): CameraFraming {
  const { i, j, k } = keyBlend(t);
  const p = keys[i].camera;
  const q = keys[j].camera;
  return {
    offset: [0, 1, 2].map((n) => MathUtils.lerp(p.offset[n], q.offset[n], k)) as CameraFraming['offset'],
    lookAtIsland: MathUtils.lerp(p.lookAtIsland, q.lookAtIsland, k),
  };
}

/** The chapter whose range contains `t`. */
export const chapterAt = (t: number) => chapters.find((c) => t >= c.range[0] && t <= c.range[1]) ?? chapters[chapters.length - 1];
