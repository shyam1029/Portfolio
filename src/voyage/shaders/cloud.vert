// Billboard cloud puffs: each instance is a camera-facing quad at aCenter.
attribute vec3 aCenter;
attribute float aSize;
attribute float aSeed;
attribute float aShade; // 0 = bottom of the cloud, 1 = top
uniform float uTime;
varying vec2 vUv;
varying float vSeed;
varying float vShade;
varying float vFade;
varying vec3 vCenterWorld;

void main() {
  vec3 center = aCenter + vec3(uTime * 0.9, 0.0, 0.0); // slow drift
  vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 camUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 world = center + (camRight * position.x + camUp * position.y) * aSize;
  vUv = uv;
  vSeed = aSeed;
  vShade = aShade;
  vCenterWorld = center;
  vFade = 1.0 - smoothstep(550.0, 850.0, distance(cameraPosition, center));
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
