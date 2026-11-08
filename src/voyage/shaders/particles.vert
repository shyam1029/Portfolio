// Looping particles that rise from a base and spread out (smoke, data motes, sparks).
attribute vec3 aOffset; // x,z: spawn offset; y: phase
attribute float aSeed;
uniform float uTime;
uniform float uHeight;
uniform float uSpeed;
uniform float uSpread;
uniform float uSize;
uniform float uGrow;
uniform float uPixelRatio;
varying float vLife;
varying float vSeed;

void main() {
  float life = fract(aOffset.y + uTime * uSpeed * (0.7 + aSeed * 0.6));
  vec3 p = vec3(aOffset.x, 0.0, aOffset.z) * (1.0 + life * uSpread);
  p.y = life * uHeight;
  p.x += sin(uTime * 0.7 + aSeed * 30.0) * life * uSpread * 0.8 + life * life * uSpread * 2.0; // drift downwind
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (1.0 + life * uGrow) * uPixelRatio * 100.0 / max(-mv.z, 0.1);
  vLife = life;
  vSeed = aSeed;
}
