// Volumetric-looking light cone: brightest at the lamp, fading with distance, soft at the edges
// (strongest where we look through the middle of the cone), with drifting dust in the air.
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;
varying float vAlong;
varying vec3 vNormal;
varying vec3 vWorld;

float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}

void main() {
  vec3 V = normalize(cameraPosition - vWorld);
  float facing = pow(clamp(abs(dot(normalize(vNormal), V)), 0.0, 1.0), 1.4);
  float falloff = pow(clamp(vAlong, 0.0, 1.0), 1.5); // clamp: pow of a negative is NaN, which bloom smears black
  float dust = 0.75 + 0.25 * noise(vWorld * 0.35 + vec3(0.0, uTime * 0.3, uTime * 0.2));
  float a = facing * falloff * dust * uOpacity;
  gl_FragColor = vec4(uColor * a * 1.8, a);
}
