import { useMemo } from 'react';
import { ShaderMaterial, UniformsLib, Vector4 } from 'three';
import oceanVert from '../shaders/ocean.vert?raw';
import oceanFrag from '../shaders/ocean.frag?raw';
import { uniforms } from '../world/atmosphere';
import { islands } from '../world/route';

export function Ocean() {
  const material = useMemo(() => {
    const spots = Array.from({ length: 5 }, (_, i) => {
      const s = islands[i];
      return s ? new Vector4(s.position.x, s.position.z, s.radius, 0) : new Vector4(1e5, 1e5, 0, 0);
    });
    return new ShaderMaterial({
      vertexShader: oceanVert,
      fragmentShader: oceanFrag,
      uniforms: {
        ...UniformsLib.fog,
        uTime: uniforms.uTime,
        uStorm: uniforms.uStorm,
        uFlash: uniforms.uFlash,
        uWaterDeep: uniforms.uWaterDeep,
        uWaterShallow: uniforms.uWaterShallow,
        uFoam: uniforms.uFoam,
        uIslands: { value: spots },
      },
      fog: true,
    });
  }, []);

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -340]} material={material}>
      <planeGeometry args={[1400, 1400, 280, 280]} />
    </mesh>
  );
}
