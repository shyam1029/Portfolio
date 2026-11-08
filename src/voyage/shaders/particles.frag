uniform vec3 uColor;
uniform float uOpacity;
uniform float uSoft; // 1 = soft smoke puff, 0 = crisp spark
varying float vLife;
varying float vSeed;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c) * 2.0;
  if (r > 1.0) discard;
  float shape = mix(1.0 - smoothstep(0.2, 1.0, r), 1.0 - smoothstep(0.0, 1.0, r) * (0.7 + 0.3 * sin(vSeed * 40.0 + atan(c.y, c.x) * 3.0)), uSoft);
  float fade = smoothstep(0.0, 0.1, vLife) * (1.0 - smoothstep(0.6, 1.0, vLife));
  float a = shape * fade * uOpacity;
  vec3 color = uColor * mix(1.0, 0.75, vLife * uSoft);
  gl_FragColor = vec4(color, a);
  #include <colorspace_fragment>
}
