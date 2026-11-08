varying vec3 vDir;

void main() {
  vDir = position;
  vec4 clip = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  gl_Position = clip.xyww; // always at the far plane
}
