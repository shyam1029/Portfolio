varying vec2 vUv;
uniform float uSize;

void main() {
  vUv = uv;
  // Camera-facing billboard around the object's origin.
  vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  center.xy += position.xy * uSize;
  gl_Position = projectionMatrix * center;
}
