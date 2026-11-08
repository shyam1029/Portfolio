varying float vAlong; // 0 at the far, wide end of the cone, 1 at the lamp
varying vec3 vNormal;
varying vec3 vWorld;
uniform float uLength;

void main() {
  vAlong = position.y / uLength + 0.5;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
