import { Color, DataTexture, MeshToonMaterial, NearestFilter, NoColorSpace, RGBAFormat, type ColorRepresentation } from 'three';

/** Three hard light bands: the cel-shaded look. */
const gradient = (() => {
  const levels = [95, 175, 255];
  const data = new Uint8Array(levels.flatMap((l) => [l, l, l, 255]));
  const tex = new DataTexture(data, levels.length, 1, RGBAFormat);
  tex.minFilter = tex.magFilter = NearestFilter;
  tex.colorSpace = NoColorSpace;
  tex.needsUpdate = true;
  return tex;
})();

const cache = new Map<string, MeshToonMaterial>();

/** Shared cel-shaded material per colour (and emissive), so identical props share one material. */
export function toon(color: ColorRepresentation, emissive?: ColorRepresentation) {
  const key = `${new Color(color).getHexString()}:${emissive ? new Color(emissive).getHexString() : ''}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshToonMaterial({ color, gradientMap: gradient });
    if (emissive) m.emissive = new Color(emissive);
    cache.set(key, m);
  }
  return m;
}

export const toonGradient = gradient;

/** Ink outline colour used across the world. */
export const INK = '#1b1b33';
