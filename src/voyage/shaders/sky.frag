uniform float uTime;
uniform vec3 uSkyTop;
uniform vec3 uSkyBottom;
uniform vec3 uSun;
uniform vec3 uSunDir;
uniform float uStars;
uniform float uStorm;
uniform float uFlash;
varying vec3 vDir;

float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
vec3 hash33(vec3 p) {
  return fract(sin(vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)))) * 43758.5453);
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm3(vec3 p) { return noise3(p) * 0.5 + noise3(p * 2.1) * 0.3 + noise3(p * 4.3) * 0.2; }

/** Round stars on a jittered grid; `density` = fraction of cells with a star. */
float starLayer(vec3 d, float scale, float density, float size) {
  vec3 p = d * scale;
  vec3 cell = floor(p);
  vec3 jitter = hash33(cell);
  if (jitter.x > density) return 0.0;
  vec3 local = fract(p) - 0.2 - jitter * 0.6;
  float twinkle = 0.65 + 0.35 * sin(uTime * (1.5 + jitter.y * 3.0) + jitter.z * 40.0);
  return smoothstep(size, 0.0, length(local)) * twinkle * (0.4 + jitter.y * 0.6);
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;

  // Base gradient, plus brighter haze near the horizon (light scattering through more air).
  vec3 color = mix(uSkyBottom, uSkyTop, smoothstep(-0.02, 0.6, h));
  color += mix(uSkyBottom, uSun, 0.25) * exp(-max(h, 0.0) * 9.0) * 0.1 * (1.0 - uStars * 0.6);

  // Sun: warm glow around it that widens near the horizon (sunsets), a hard disc,
  // and a soft halo that also works as the moon's halo at night.
  float s = max(dot(d, uSunDir), 0.0);
  float lowSun = 1.0 - smoothstep(0.0, 0.5, uSunDir.y);
  color += uSun * (pow(s, 8.0) * (0.12 + lowSun * 0.35) + pow(s, 48.0) * 0.5) * (1.0 - uStorm * 0.85);
  float disc = smoothstep(0.9968, 0.9975, s);
  color = mix(color, uSun * 1.6 + 0.2, disc * (1.0 - uStorm));

  // Night sky: Milky Way band, many faint stars, a few bright ones.
  if (uStars > 0.01) {
    vec3 bandN = normalize(vec3(0.35, 0.25, 0.9));
    float band = exp(-pow(dot(d, bandN) / 0.22, 2.0));
    float dust = fbm3(d * 6.0) * fbm3(d * 13.0 + 3.0);
    vec3 milky = vec3(0.55, 0.6, 0.95) * band * smoothstep(0.15, 0.55, dust) * 0.35;
    float stars = starLayer(d, 220.0, 0.35 + band * 0.4, 0.09) * 0.7 + starLayer(d, 70.0, 0.18, 0.06) * 1.4;
    float aboveHorizon = smoothstep(0.0, 0.12, h);
    color += (milky + stars * vec3(0.9, 0.95, 1.0)) * uStars * aboveHorizon * (1.0 - uStorm);
  }

  color += uFlash * 0.6;
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
