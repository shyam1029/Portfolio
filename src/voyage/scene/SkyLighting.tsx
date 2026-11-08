import { useMemo } from 'react';
import { Environment } from '@react-three/drei';
import { BackSide, ShaderMaterial } from 'three';
import skyVert from '../shaders/sky.vert?raw';
import skyFrag from '../shaders/sky.frag?raw';
import { uniforms } from '../world/atmosphere';

/**
 * Image-based lighting from our own animated sky: a tiny cube map of the sky dome is
 * re-rendered every frame, so every standard material picks up the chapter's sky colours.
 */
export function SkyLighting() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        uniforms: {
          uTime: uniforms.uTime, uSkyTop: uniforms.uSkyTop, uSkyBottom: uniforms.uSkyBottom, uSun: uniforms.uSun,
          uSunDir: uniforms.uSunDir, uStars: { value: 0 }, uStorm: uniforms.uStorm, uFlash: uniforms.uFlash,
        },
        side: BackSide,
        depthWrite: false,
      }),
    [],
  );

  return (
    <Environment frames={Infinity} resolution={32} environmentIntensity={0.5}>
      <mesh material={material}>
        <sphereGeometry args={[500, 24, 12]} />
      </mesh>
    </Environment>
  );
}
