uniform vec3 uCloud;
uniform vec3 uSkyTop;
uniform vec3 uSkyBottom;
uniform vec3 uSun;
uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform float uStorm;
uniform float uFlash;
varying vec3 vNormal;
varying vec3 vWorld;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(uSunDir);

  // Soft wrap lighting: sunlit tops, shadowed bellies tinted by the sky.
  float wrap = dot(N, L) * 0.5 + 0.5;
  vec3 shadow = mix(uSkyBottom, uSkyTop, 0.5) * 0.55 + uCloud * 0.25;
  vec3 lit = uCloud * (0.75 + 0.35 * uSunIntensity * 0.4) + uSun * 0.12;
  vec3 color = mix(shadow, lit, smoothstep(0.15, 0.95, wrap));
  color *= mix(1.0, 0.75, uStorm * (1.0 - N.y * 0.5));

  // Silver lining: edges glow when the sun is behind the cloud.
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float behind = pow(max(dot(-V, L), 0.0), 3.0);
  color += uSun * rim * (0.25 + behind * 1.4) * (1.0 - uStorm);

  // Feathered edges so the puffs melt into each other and the sky.
  float alpha = smoothstep(0.0, 0.45, max(dot(N, V), 0.0));
  color += uFlash * 0.5;
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
