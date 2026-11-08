import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Atmosphere } from './scene/Atmosphere';
import { Ocean } from './scene/Ocean';
import { Clouds } from './scene/Clouds';
import { Rain } from './scene/Rain';
import { Ship } from './scene/Ship';
import { Islands } from './scene/Islands';
import { CameraRig } from './scene/CameraRig';
import { SkyLighting } from './scene/SkyLighting';
import { ShadowSetup } from './scene/ShadowSetup';
import { Effects } from './scene/Effects';
import { Overlay } from './ui/Overlay';
import { useSmoothScroll } from './world/useSmoothScroll';
import { route } from './world/route';

const start = route.getPointAt(0);

/** The home page experience: a fixed 3D canvas driven by scrolling a tall page. */
export default function Voyage() {
  useSmoothScroll();

  return (
    <>
      <div className="voyage-canvas" aria-hidden="true">
        <Canvas
          shadows="percentage"
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 50, near: 0.1, far: 2000, position: [start.x + 7, 4, start.z + 14] }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 0.9;
          }}
        >
          <Atmosphere />
          <Ocean />
          <Clouds />
          <Rain />
          <Suspense fallback={null}>
            <Ship />
            <Islands />
          </Suspense>
          <CameraRig />
          <SkyLighting />
          <ShadowSetup />
          <Effects />
        </Canvas>
      </div>
      <Overlay />
      <div className="voyage-scroll" />
    </>
  );
}
