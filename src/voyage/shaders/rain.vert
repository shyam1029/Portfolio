// Rain streaks wrapped in a box that follows the camera.
attribute float aTip; // 0 = bottom of streak, 1 = top
attribute float aSeed;
uniform float uTime;
uniform float uStorm;
varying float vAlpha;

void main() {
  float box = 70.0;
  vec3 p = position;
  p.y -= uTime * (38.0 + aSeed * 14.0);
  p.x -= uTime * 6.0; // wind
  p = mod(p - cameraPosition + box * 0.5, box) - box * 0.5 + cameraPosition;
  p += vec3(-0.25, 1.6, 0.0) * aTip; // streak direction
  vec4 mvPosition = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vAlpha = uStorm * smoothstep(box * 0.5, 4.0, -mvPosition.z) * step(0.0, p.y);
}
