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

void main() {
  vec3 d = normalize(vDir);
  vec3 color = mix(uSkyBottom, uSkyTop, smoothstep(-0.02, 0.55, d.y));

  // Sun (or moon): hard-edged disc plus a soft halo.
  float s = max(dot(d, uSunDir), 0.0);
  float disc = smoothstep(0.9965, 0.997, s);
  color = mix(color, uSun * 1.2 + 0.15, disc * (1.0 - uStorm));
  color += uSun * pow(s, 20.0) * 0.35 * (1.0 - uStorm * 0.8);

  // Twinkling stars on a direction grid.
  vec3 cell = floor(d * 160.0);
  float h = hash3(cell);
  float star = step(0.9965, h) * smoothstep(0.02, 0.2, d.y);
  color += star * uStars * (0.55 + 0.45 * sin(uTime * 2.5 + h * 60.0));

  color += uFlash * 0.6;
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
