uniform float uTime;
uniform float uStorm;
uniform float uFlash;
uniform vec3 uWaterDeep;
uniform vec3 uWaterShallow;
uniform vec3 uFoam;
uniform vec3 uSkyTop;
uniform vec3 uSkyBottom;
uniform vec3 uSun;
uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform vec3 uAmbient;
uniform float uAmbientIntensity;
uniform vec3 uShipPos;
uniform vec3 uShipDir;
uniform vec4 uIslands[5]; // x, z, radius, unused
varying vec3 vWorld;
varying vec3 vNormal;
varying float vCrest;
#include <fog_pars_fragment>

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { return vnoise(p) * 0.5 + vnoise(p * 2.03) * 0.3 + vnoise(p * 4.1) * 0.2; }

// Same gradient as the sky dome, so reflections match the sky.
vec3 skyColor(vec3 d) {
  vec3 c = mix(uSkyBottom, uSkyTop, smoothstep(-0.02, 0.55, d.y));
  float s = max(dot(d, uSunDir), 0.0);
  return c + uSun * pow(s, 20.0) * 0.4 * (1.0 - uStorm * 0.8);
}

void main() {
  // Small ripples layered on the big swells.
  vec2 rp = vWorld.xz * 0.35 + vec2(uTime * 0.25, uTime * 0.1);
  float e = 0.15;
  float r0 = fbm(rp);
  vec3 ripple = vec3(fbm(rp + vec2(e, 0.0)) - r0, 0.0, fbm(rp + vec2(0.0, e)) - r0) / e;
  vec3 N = normalize(vNormal - ripple * (0.18 + uStorm * 0.2));

  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(uSunDir);
  float NdotV = max(dot(N, V), 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - NdotV, 5.0);

  // Water body: deep in troughs, lighter toward crests, lit softly by sun and sky.
  vec3 body = mix(uWaterDeep, uWaterShallow, smoothstep(0.25, 0.95, vCrest) * 0.6);
  float diffuse = max(dot(N, L), 0.0) * 0.5 + 0.5;
  body *= uAmbient * uAmbientIntensity * 0.45 + uSun * uSunIntensity * diffuse * 0.25;

  // Light passing through thin wave crests (the glowing teal of backlit waves).
  float sss = pow(clamp(dot(V, -(L + N * 0.6)), 0.0, 1.0), 4.0) + 0.35 * pow(1.0 - NdotV, 2.0) * max(L.y, 0.0);
  vec3 glow = mix(uWaterShallow, vec3(0.15, 0.95, 0.8), 0.45) * sss * smoothstep(0.45, 1.0, vCrest) * (0.6 + uSunIntensity * 0.4);

  vec3 R = reflect(-V, N);
  R.y = abs(R.y);
  vec3 reflection = skyColor(R) * 0.8;
  vec3 color = mix(body + glow, reflection, fresnel);

  // Sun glint.
  float spec = pow(max(dot(R, L), 0.0), 350.0) * 6.0 + pow(max(dot(R, L), 0.0), 60.0) * 0.3;
  color += uSun * spec * uSunIntensity * (1.0 - uStorm);

  // ---- Foam ----
  float breakup = fbm(vWorld.xz * 0.25 + uTime * 0.05);
  float crestFoam = smoothstep(0.86 - uStorm * 0.2, 0.98, vCrest + (breakup - 0.5) * 0.25);
  float streaks = smoothstep(0.62, 0.7, fbm(vWorld.xz * 0.06 + vec2(uTime * 0.02, 0.0)) + breakup * 0.15) * 0.2 * (0.3 + uStorm);

  // Shore foam rings around each island.
  float shore = 0.0;
  for (int i = 0; i < 5; i++) {
    float d = length(vWorld.xz - uIslands[i].xy) - uIslands[i].z;
    float wobble = (fbm(vWorld.xz * 0.2 + float(i)) - 0.5) * 2.5;
    float surf = (1.0 - smoothstep(0.0, 1.6, d + wobble)) * 0.85;
    float ring = (1.0 - smoothstep(0.0, 0.5, abs(d - 3.0 - sin(uTime * 0.9 + float(i)) * 1.5 + wobble))) * 0.4;
    shore = max(shore, max(surf, ring) * step(-2.0, d));
  }

  // Wake: a V of foam trailing the ship, churned water close behind it, and foam at the hull.
  vec2 rel = vWorld.xz - uShipPos.xz;
  vec2 fwd = normalize(uShipDir.xz);
  float along = dot(rel, fwd);
  float side = dot(rel, vec2(-fwd.y, fwd.x));
  float behind = -along;
  float armDist = abs(abs(side) - (1.6 + behind * 0.22));
  float arm = (1.0 - smoothstep(0.0, 0.5 + behind * 0.02, armDist)) * smoothstep(38.0, 4.0, behind);
  float trail = smoothstep(1.8 + behind * 0.05, 0.0, abs(side)) * smoothstep(18.0, 1.0, behind);
  float churn = smoothstep(0.45, 0.75, fbm(rel * 0.6 + uTime * 0.4));
  float wake = (arm * 0.55 + trail * 0.6) * churn * step(-3.0, behind);
  float hull = 1.0 - smoothstep(0.0, 1.4, length(vec2(side / 2.4, along / 5.6)) - 1.0);
  hull *= smoothstep(0.3, 0.6, breakup + 0.15) * 0.7;

  float foam = clamp(max(max(crestFoam, streaks), max(shore, max(wake, hull))), 0.0, 1.0);
  vec3 foamLit = uFoam * (uAmbient * uAmbientIntensity * 0.5 + uSun * uSunIntensity * 0.35 + 0.25);
  color = mix(color, foamLit, foam);

  color += uFlash * 0.35;
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
  #include <fog_fragment>
}
