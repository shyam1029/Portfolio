uniform float uTime;
uniform float uStorm;
varying vec3 vWorld;
varying float vHeight; // -1..1, normalised wave height
#include <fog_pars_vertex>

// Must match waveHeight() in world/route.ts (the ship floats on this).
float waveHeight(vec2 p, float t, float storm) {
  float a = 0.35 + storm * 1.1;
  return a * (sin(p.x * 0.08 + t * 0.9) * 0.5 + sin(p.y * 0.11 - t * 1.1) * 0.35 + sin((p.x + p.y) * 0.15 + t * 1.6) * 0.15);
}

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  float h = waveHeight(world.xz, uTime, uStorm);
  world.y += h;
  vHeight = h / (0.35 + uStorm * 1.1);
  vWorld = world.xyz;
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
