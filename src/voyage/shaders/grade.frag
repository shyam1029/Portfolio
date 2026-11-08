// Final colour grade (before tone mapping): gentle contrast, saturation and a soft vignette.
uniform sampler2D tDiffuse;
uniform float uSaturation;
uniform float uContrast;
uniform float uVignette;
uniform vec3 uTint;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(tDiffuse, vUv).rgb;
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, uSaturation);
  color = (color - 0.18) * uContrast + 0.18; // pivot around mid-grey in linear space
  color = max(color, 0.0) * uTint;
  vec2 d = vUv - 0.5;
  color *= mix(1.0, smoothstep(0.85, 0.2, length(d * vec2(1.1, 1.0))), uVignette);
  gl_FragColor = vec4(color, 1.0);
}
