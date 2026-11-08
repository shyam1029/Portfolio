uniform float uTime;
uniform vec3 uCloud;
uniform vec3 uSkyTop;
uniform vec3 uSkyBottom;
uniform vec3 uSun;
uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform float uStorm;
uniform float uFlash;
varying vec2 vUv;
varying float vSeed;
varying float vShade;
varying float vFade;
varying vec3 vCenterWorld;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.07; a *= 0.5; }
  return v;
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;

  // Billowy density: a soft disc eroded by slowly evolving noise.
  float n = fbm(vec3(p * 1.6, vSeed * 17.0 + uTime * 0.02));
  float density = smoothstep(1.0, 0.45, r + (0.5 - n) * 0.55);
  if (density < 0.01) discard;

  // Pretend each puff is a sphere: build a normal in view space, take it to world space.
  vec3 nView = normalize(vec3(p, sqrt(max(1.0 - r * r, 0.0)) + 0.35));
  vec3 N = normalize(transpose(mat3(viewMatrix)) * nView);
  vec3 L = normalize(uSunDir);
  vec3 V = normalize(cameraPosition - vCenterWorld);

  float wrap = dot(N, L) * 0.5 + 0.5;
  float selfShadow = mix(0.55, 1.0, vShade) * mix(0.75, 1.0, n);
  vec3 shadowCol = mix(uSkyBottom, uSkyTop, 0.45) * 0.6 + uCloud * 0.2;
  vec3 litCol = uCloud * (0.85 + 0.15 * uSunIntensity) + uSun * 0.15;
  vec3 color = mix(shadowCol, litCol, smoothstep(0.1, 0.95, wrap * selfShadow));
  color *= mix(1.0, 0.7, uStorm);

  // Silver lining where thin edges are backlit by the sun.
  float edge = smoothstep(0.35, 0.0, density);
  float behind = pow(max(dot(-V, L), 0.0), 4.0);
  color += uSun * (edge * 0.6 + 0.15) * behind * (1.0 - uStorm);

  color += uFlash * 0.5;
  gl_FragColor = vec4(color, min(density * 1.15, 1.0) * vFade);
  #include <colorspace_fragment>
}
