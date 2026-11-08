// Hologram: bright Fresnel rim, scrolling scanlines and a faint flicker. Additive.
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vNormal;
varying vec3 vWorld;

void main() {
  vec3 V = normalize(cameraPosition - vWorld);
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), V)), 2.0);
  float scan = smoothstep(0.4, 0.5, fract(vWorld.y * 2.5 - uTime * 0.8)) * 0.35;
  float flicker = 0.85 + 0.15 * sin(uTime * 23.0 + vWorld.y * 3.0);
  float a = (fresnel * 0.9 + scan + 0.08) * flicker * uOpacity;
  gl_FragColor = vec4(uColor * a, a);
}
