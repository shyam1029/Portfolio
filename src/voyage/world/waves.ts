// Gerstner waves: rounded troughs and sharp crests, like real swells.
// The same four waves are evaluated on the GPU (shaders/ocean.vert) and here on the CPU
// so the ship and bottles float exactly on the drawn surface. Keep both in sync.

export const WAVES = [
  { dir: [1.0, 0.3], steep: 0.18, length: 48 },
  { dir: [0.7, -0.6], steep: 0.14, length: 30 },
  { dir: [-0.4, 1.0], steep: 0.1, length: 18 },
  { dir: [0.2, 0.9], steep: 0.07, length: 11 },
] as const;

export const TIME_SCALE = 0.55;
/** Storm makes waves steeper and longer (steepness sum stays below 1 so crests never loop). */
export const stormSteep = (storm: number) => 0.55 + storm * 0.95;
export const stormLength = (storm: number) => 1 + storm * 0.6;

const G = 9.8;
const norm = WAVES.map((w) => {
  const l = Math.hypot(w.dir[0], w.dir[1]);
  return [w.dir[0] / l, w.dir[1] / l] as const;
});

/** Displacement of the surface point that started at (x, z). */
function displace(x: number, z: number, t: number, storm: number) {
  let dx = 0, dy = 0, dz = 0;
  const s = stormSteep(storm);
  const L = stormLength(storm);
  WAVES.forEach((w, i) => {
    const [ax, az] = norm[i];
    const k = (2 * Math.PI) / (w.length * L);
    const c = Math.sqrt(G / k);
    const f = k * (ax * x + az * z - c * t * TIME_SCALE);
    const a = (w.steep * s) / k;
    dx += ax * a * Math.cos(f);
    dy += a * Math.sin(f);
    dz += az * a * Math.cos(f);
  });
  return [dx, dy, dz] as const;
}

/** Height of the ocean surface above world point (x, z). Inverts the horizontal shift iteratively. */
export function waveHeight(x: number, z: number, t: number, storm: number) {
  let px = x, pz = z;
  for (let i = 0; i < 3; i++) {
    const [dx, , dz] = displace(px, pz, t, storm);
    px = x - dx;
    pz = z - dz;
  }
  return displace(px, pz, t, storm)[1];
}
