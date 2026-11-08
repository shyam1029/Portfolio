uniform float uTime;
varying vec3 vNormal;
varying vec3 vWorld;

void main() {
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
  world.x += uTime * 0.9; // slow drift
  vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
