varying float vAlpha;

void main() {
  gl_FragColor = vec4(vec3(0.8, 0.88, 0.95), vAlpha * 0.5);
}
