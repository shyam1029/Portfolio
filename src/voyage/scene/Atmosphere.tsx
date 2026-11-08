import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AmbientLight, BackSide, DirectionalLight, Fog, MathUtils, Mesh, ShaderMaterial } from 'three';
import skyVert from '../shaders/sky.vert?raw';
import skyFrag from '../shaders/sky.frag?raw';
import { atmosphere, sampleAtmosphere, uniforms } from '../world/atmosphere';
import { useVoyage } from '../world/store';

/**
 * Sky, fog, lights and lightning. Runs first each frame (priority -1) and refreshes the shared
 * atmosphere uniforms that the ocean, clouds and rain read.
 */
export function Atmosphere() {
  const sky = useRef<Mesh>(null);
  const fog = useRef<Fog>(null);
  const ambient = useRef<AmbientLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const nextFlash = useRef(0);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        uniforms: {
          uTime: uniforms.uTime,
          uSkyTop: uniforms.uSkyTop,
          uSkyBottom: uniforms.uSkyBottom,
          uSun: uniforms.uSun,
          uSunDir: uniforms.uSunDir,
          uStars: uniforms.uStars,
          uStorm: uniforms.uStorm,
          uFlash: uniforms.uFlash,
        },
        side: BackSide,
        depthWrite: false,
      }),
    [],
  );

  useFrame(({ camera, clock }, delta) => {
    const t = clock.elapsedTime;
    sampleAtmosphere(useVoyage.getState().progress);

    // Lightning: random double-flashes while the storm is strong.
    if (atmosphere.storm > 0.6 && t > nextFlash.current) {
      atmosphere.flash = 1;
      nextFlash.current = t + 2.5 + Math.random() * 4;
    }
    atmosphere.flash = Math.max(0, atmosphere.flash - delta * 5);
    const flicker = atmosphere.flash * (0.6 + 0.4 * Math.sin(t * 60));

    uniforms.uTime.value = t;
    uniforms.uStars.value = atmosphere.stars;
    uniforms.uStorm.value = atmosphere.storm;
    uniforms.uFlash.value = flicker;

    if (fog.current) fog.current.color.copy(atmosphere.skyBottom);
    if (ambient.current) {
      ambient.current.color.copy(atmosphere.ambient);
      ambient.current.intensity = atmosphere.ambientIntensity + flicker * 2;
    }
    if (sun.current) {
      sun.current.color.copy(atmosphere.sun);
      sun.current.intensity = atmosphere.sunIntensity;
      sun.current.position.copy(camera.position).addScaledVector(atmosphere.sunDir, 100);
      sun.current.target.position.copy(camera.position);
      sun.current.target.updateMatrixWorld();
    }
    sky.current?.position.copy(camera.position);
    // Fog closes in during the storm.
    if (fog.current) fog.current.far = MathUtils.lerp(420, 180, atmosphere.storm);
  }, -1);

  return (
    <>
      <fog ref={fog} attach="fog" args={['#000', 60, 420]} />
      <ambientLight ref={ambient} />
      <directionalLight ref={sun} />
      <mesh ref={sky} material={material} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[900, 32, 16]} />
      </mesh>
    </>
  );
}
