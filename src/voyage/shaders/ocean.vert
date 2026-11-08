uniform float uTime;
uniform float uStorm;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vCrest; // 0 in troughs, 1 on crests
#include <fog_pars_vertex>

// Must match world/waves.ts (the ship floats on this surface).
const float G = 9.8;
const float TIME_SCALE = 0.55;

vec3 gerstner(vec2 p, vec2 dir, float steep, float wavelength, inout vec3 tangent, inout vec3 binormal) {
  vec2 d = normalize(dir);
  float k = 6.28318 / wavelength;
  float c = sqrt(G / k);
  float f = k * (dot(d, p) - c * uTime * TIME_SCALE);
  float a = steep / k;
  float s = sin(f), co = cos(f);
  tangent += vec3(-d.x * d.x * steep * s, d.x * steep * co, -d.x * d.y * steep * s);
  binormal += vec3(-d.x * d.y * steep * s, d.y * steep * co, -d.y * d.y * steep * s);
  return vec3(d.x * a * co, a * s, d.y * a * co);
}

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  float st = 0.55 + uStorm * 0.95;
  float ln = 1.0 + uStorm * 0.6;
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);
  vec3 offset = vec3(0.0);
  offset += gerstner(world.xz, vec2(1.0, 0.3), 0.18 * st, 48.0 * ln, tangent, binormal);
  offset += gerstner(world.xz, vec2(0.7, -0.6), 0.14 * st, 30.0 * ln, tangent, binormal);
  offset += gerstner(world.xz, vec2(-0.4, 1.0), 0.10 * st, 18.0 * ln, tangent, binormal);
  offset += gerstner(world.xz, vec2(0.2, 0.9), 0.07 * st, 11.0 * ln, tangent, binormal);
  world.xyz += offset;

  vNormal = normalize(cross(binormal, tangent));
  // Crest factor from height relative to the combined amplitude.
  float amp = (0.18 * 48.0 + 0.14 * 30.0 + 0.10 * 18.0 + 0.07 * 11.0) * st * ln / 6.28318;
  vCrest = clamp(offset.y / amp * 0.5 + 0.5, 0.0, 1.0);
  vWorld = world.xyz;
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
