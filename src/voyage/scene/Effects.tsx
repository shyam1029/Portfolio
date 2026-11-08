import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { HalfFloatType, MathUtils, Vector2, Vector3, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import gradeFrag from '../shaders/grade.frag?raw';
import fullscreenVert from '../shaders/fullscreen.vert?raw';
import { atmosphere } from '../world/atmosphere';
import { useVoyage } from '../world/store';

/**
 * Post-processing with three's own EffectComposer (the `postprocessing` library has tinted
 * frames red with this three version):
 * scene (4x MSAA) -> bloom -> colour grade -> output (ACES tone mapping + sRGB).
 * Rendering at priority 1 takes over R3F's render loop.
 */
export function Effects() {
  const { gl, scene, camera, size } = useThree();
  const frames = useRef(0);

  const { composer, bloom, grade } = useMemo(() => {
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
    const c = new EffectComposer(gl, target);
    c.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new Vector2(256, 256), 0.3, 0.5, 1.15);
    c.addPass(bloomPass);
    const gradePass = new ShaderPass({
      vertexShader: fullscreenVert,
      fragmentShader: gradeFrag,
      uniforms: {
        tDiffuse: { value: null },
        uSaturation: { value: 1.08 },
        uContrast: { value: 1.06 },
        uVignette: { value: 0.35 },
        uTint: { value: new Vector3(1, 1, 1) },
      },
    });
    c.addPass(gradePass);
    c.addPass(new OutputPass());
    return { composer: c, bloom: bloomPass, grade: gradePass };
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, gl, size]);
  useEffect(() => () => composer.dispose(), [composer]);

  useFrame((_, delta) => {
    if (!useVoyage.getState().ready && ++frames.current > 3) {
      useVoyage.getState().setReady();
      if (import.meta.env.DEV) console.info(`[voyage] first frames after ${Math.round(performance.now())} ms`);
    }
    // Night and storm: moodier, less saturated, heavier vignette; lanterns bloom more at night.
    const mood = Math.max(atmosphere.stars, atmosphere.storm);
    grade.uniforms.uSaturation.value = MathUtils.lerp(1.1, 0.85, atmosphere.storm);
    grade.uniforms.uVignette.value = MathUtils.lerp(0.3, 0.55, mood);
    grade.uniforms.uContrast.value = MathUtils.lerp(1.05, 1.12, atmosphere.storm);
    bloom.strength = MathUtils.lerp(0.25, 0.6, atmosphere.stars);
    composer.render(delta);
  }, 1);
  return null;
}
