import { Color, MeshStandardMaterial, type ColorRepresentation, type Material } from 'three';
import { uniforms } from '../world/atmosphere';

const cache = new Map<string, MeshStandardMaterial>();

type PaintOptions = { emissive?: ColorRepresentation; roughness?: number; metalness?: number; sway?: number };

/** Wind sway settings: strength, and the local-y range over which motion ramps from 0 (base) to full (tip). */
export type Sway = { amount: number; base?: number; height?: number };

/**
 * Shared stylised-PBR material per colour/options: soft roughness, lit by the sky environment,
 * with a gentle rim light so silhouettes read against the sky. `sway` adds wind motion
 * (0 = static; ~1 for leaves, which move more toward their tips).
 */
export function paint(color: ColorRepresentation, options: PaintOptions | ColorRepresentation = {}) {
  const o: PaintOptions = typeof options === 'object' && !(options instanceof Color) ? options : { emissive: options };
  const key = [new Color(color).getHexString(), o.emissive ? new Color(o.emissive).getHexString() : '', o.roughness ?? '', o.metalness ?? '', o.sway ?? ''].join(':');
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({ color, roughness: o.roughness ?? 0.82, metalness: o.metalness ?? 0 });
    if (o.emissive) {
      m.emissive = new Color(o.emissive);
      m.emissiveIntensity = 1.6;
    }
    stylise(m, o.sway ? { amount: o.sway } : undefined);
    cache.set(key, m);
  }
  return m;
}

/** Rim light (+ optional wind sway) injected into a standard material. */
export function stylise(material: Material, sway?: Sway) {
  const amount = sway?.amount ?? 0;
  const base = sway?.base ?? -1.8;
  const height = sway?.height ?? 3.6;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uRimColor = uniforms.uSun;
    shader.uniforms.uSway = { value: amount };
    shader.uniforms.uSwayBase = { value: base };
    shader.uniforms.uSwayHeight = { value: height };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uSway;\nuniform float uSwayBase;\nuniform float uSwayHeight;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        if (uSway > 0.0) {
          vec4 swayWorld = modelMatrix * vec4(transformed, 1.0);
          float tip = clamp((position.y - uSwayBase) / uSwayHeight, 0.0, 1.0);
          float gust = sin(uTime * 1.7 + swayWorld.x * 0.25 + swayWorld.z * 0.2) + 0.4 * sin(uTime * 3.1 + swayWorld.z * 0.5);
          transformed.x += gust * 0.12 * uSway * tip * tip * 3.0;
          transformed.z += cos(uTime * 1.3 + swayWorld.x * 0.3) * 0.08 * uSway * tip * tip * 3.0;
        }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float rim = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), 3.0);
        totalEmissiveRadiance += uRimColor * rim * 0.18;`,
      );
  };
  material.customProgramCacheKey = () => `stylised-${amount}-${base}-${height}`;
}
