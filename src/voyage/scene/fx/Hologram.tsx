import { useMemo } from 'react';
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from 'three';
import vert from '../../shaders/hologram.vert?raw';
import frag from '../../shaders/hologram.frag?raw';
import { uniforms } from '../../world/atmosphere';

/** Additive hologram material (rim glow + scanlines). Mutate `.uniforms.uOpacity.value` to fade. */
export function useHologram(color: string) {
  return useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: { uTime: uniforms.uTime, uColor: { value: new Color(color) }, uOpacity: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    [color],
  );
}
