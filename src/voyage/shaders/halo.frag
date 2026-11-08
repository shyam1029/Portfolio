// Lamp glow billboard: soft core, wide halo, and four thin streaks that flare when the beam faces us.
uniform float uIntensity;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float core = exp(-r * r * 40.0);
  float halo = exp(-r * 4.0) * 0.35;
  float streaks = (exp(-abs(p.y) * 60.0) + exp(-abs(p.x) * 60.0)) * (1.0 - smoothstep(0.0, 1.0, r)) * 0.5;
  float a = (core + halo + streaks) * uIntensity;
  gl_FragColor = vec4(uColor * a, a);
}
