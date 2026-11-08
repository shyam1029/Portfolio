uniform float uTime;
uniform float uStorm;
uniform float uFlash;
uniform vec3 uWaterDeep;
uniform vec3 uWaterShallow;
uniform vec3 uFoam;
uniform vec4 uIslands[5]; // x, z, radius, unused
varying vec3 vWorld;
varying float vHeight;
#include <fog_pars_fragment>

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

void main() {
  vec2 p = vWorld.xz * 0.05 + vec2(uTime * 0.04, uTime * 0.015);

  // Toon water: wave height (broken up by small-scale noise) quantised into three flat bands.
  float shade = vHeight * 0.5 + 0.5 + (vnoise(p * 9.0 + uTime * 0.1) - 0.5) * 0.45;
  float band = floor(clamp(shade, 0.0, 0.999) * 3.0) / 2.0;
  vec3 color = mix(uWaterDeep, uWaterShallow, band * 0.7);

  // Drifting foam streaks: thin contour lines of warped noise, like inked highlights.
  float n = vnoise(p * 7.0 + vnoise(p * 2.0 + uTime * 0.06) * 2.5);
  float streak = step(0.78 - uStorm * 0.08, n) * (1.0 - step(0.8, n));
  float crestLine = vHeight * 0.5 + 0.5;
  float crest = step(0.9 - uStorm * 0.12, crestLine) * (1.0 - step(0.94 - uStorm * 0.12, crestLine));

  // Animated foam rings around each island's shore.
  float shore = 0.0;
  for (int i = 0; i < 5; i++) {
    float d = length(vWorld.xz - uIslands[i].xy) - uIslands[i].z;
    float wobble = sin(atan(vWorld.z - uIslands[i].y, vWorld.x - uIslands[i].x) * 7.0 + uTime) * 0.6;
    float ring1 = 1.0 - step(0.9, abs(d - 1.2 - wobble));
    float ring2 = 1.0 - step(0.5, abs(d - 4.5 - wobble - sin(uTime * 0.8 + float(i)) * 1.5));
    shore = max(shore, max(ring1, ring2 * 0.8) * step(-1.0, d));
  }

  color = mix(color, uFoam, max(max(streak * 0.9, crest), shore));
  color += uFlash * 0.35;

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
  #include <fog_fragment>
}
