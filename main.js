import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SimplexNoise } from 'https://cdn.jsdelivr.net/npm/simplex-noise@3.0.1/+esm';

//
// LOADING MANAGER
//
const manager = new THREE.LoadingManager();
const progressContainer = document.querySelector(".progress-bar-container");
const progressBar = document.querySelector("progress#progress-bar");
const progressText = document.querySelector("label.progress-bar");
const introGesture = document.querySelector(".intro-gesture");

manager.onStart = () => {
  setTimeout(() => progressText.innerText = "Almost done...", 1300);
};
manager.onLoad = () => {
  progressContainer.style.display = "none";
  introGesture.classList.add("visible");
};
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
  progressBar.value = itemsLoaded / itemsTotal;
};
manager.onError = (url) => {
  console.error("Error loading " + url);
};

//
// SETUP AND UTILITIES
//
const canvas = document.querySelector('canvas.webgl');
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};
const aspect = sizes.width / sizes.height;
const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, smoothTouch: true });

let time = 0;
const noise = new SimplexNoise();
const clock = new THREE.Clock();

// Scene parameters
const waterParams = {
  amplitude: 0.75,
  speed: 1.2,
  noiseScale: 0.15
};

const floorParams = {
  depth: -25,
  elevation: 3,
  size: 500
};

const sunPosition = new THREE.Vector3(70, 50, 70);

//
// SCENE
//
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

//
// OBJECTS
//
let curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(85, -16, 70), // Start
  new THREE.Vector3(58, -20, 46), // Near reef 1
  new THREE.Vector3(70, 50, 70), // Near fish
  new THREE.Vector3(70, 120, 71),  // End at chest
]);

//
// CAMERA
//
const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
camera.position.set(85, -16, 70); // Start at the beginning of the path
scene.add(camera);

//
// RENDERER
//
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Shadows still enabled (good if you use some lights)
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;


//
// BLOOM PASS
//
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, // strength
  0.4, // radius
  0.85 // threshold
);
composer.addPass(bloomPass);



//
// SCROLL
//
let lastScrollT = 0;
lenis.on('scroll', ({ scroll, limit, velocity, progress }) => {
  const t = Math.min(scroll / (limit || 1), 1);
  const point = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t);
  camera.position.copy(point);
  camera.lookAt(point.clone().add(tangent));

  // Hide intro gesture on scroll start
  if (t > 0 && introGesture.classList.contains("visible")) {
    gsap.to(introGesture, { opacity: 0, duration: 0.8, onComplete: () => introGesture.style.display = 'none' });
  }

  // Handle intro_card position based on scroll
  const isScrollingForward = t > lastScrollT;
  if (t >= 0.99) {
    gsap.to(intro_card.position, {x: 70, y: 150, z: 70, duration: 0.1, ease: 'power2.out'});
    gsap.to(intro_card.rotation, {x: Math.PI/2, duration: 0.1, ease: 'power2.out'});
    gsap.to(intro_card.rotation, {y: Math.PI/10, duration: 0.1, ease: 'power2.out'});
    gsap.to(intro_card.rotation, {z: Math.PI, duration: 0.1, ease: 'power2.out'});
  } else if (lastScrollT >= 0.99 && t < 0.99 && !isScrollingForward) {
    gsap.to(intro_card.position, {x: 70, y: 110, z: 71, duration: 0.1, ease: 'power2.out'});
    gsap.to(intro_card.rotation, {y: Math.PI/2, duration: 0.1, ease: 'power2.out'});
  }
  lastScrollT = t;

  const ui = document.getElementById('project-ui');
  if (t > 0.15 && t < 0.30) {
    gsap.to(ui, { opacity: 1, duration: 0.5, onStart: () => ui.style.display = 'block' });
  } else {
    gsap.to(ui, { opacity: 0, duration: 0.5, onComplete: () => ui.style.display = 'none' });
  }

  const ui2 = document.getElementById('contact-ui');
  if (t > 0.40 && t < 0.60) {
    gsap.to(ui2, { opacity: 1, duration: 0.5, onStart: () => ui2.style.display = 'block' });
  } else {
    gsap.to(ui2, { opacity: 0, duration: 0.5, onComplete: () => ui2.style.display = 'none' });
  }
});

//
// LIGHTS
//
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
sunLight.position.copy(sunPosition);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 1000;
sunLight.shadow.camera.left = -50;
sunLight.shadow.camera.right = 50;
sunLight.shadow.camera.top = 50;
sunLight.shadow.camera.bottom = -50;
scene.add(sunLight);

//
// CARD
//

const generateCubeMap = () => {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size * 4; i += 4) {
    data[i] = 100;
    data[i + 1] = 150;
    data[i + 2] = 200;
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return new THREE.CubeTexture([
    texture, texture, texture, texture, texture, texture
  ]);
};

const cardEnvMap = generateCubeMap();
cardEnvMap.needsUpdate = true;

const cardWidth = 4;
const cardHeight = 2.52;
const cardThickness = 0.01;
const cardCornerRadius = 0.2;

const cardShape = new THREE.Shape();
cardShape.moveTo(-cardWidth / 2 + cardCornerRadius, -cardHeight / 2);
cardShape.lineTo(cardWidth / 2 - cardCornerRadius, -cardHeight / 2);
cardShape.quadraticCurveTo(cardWidth / 2, -cardHeight / 2, cardWidth / 2, -cardHeight / 2 + cardCornerRadius);
cardShape.lineTo(cardWidth / 2, cardHeight / 2 - cardCornerRadius);
cardShape.quadraticCurveTo(cardWidth / 2, cardHeight / 2, cardWidth / 2 - cardCornerRadius, cardHeight / 2);
cardShape.lineTo(-cardWidth / 2 + cardCornerRadius, cardHeight / 2);
cardShape.quadraticCurveTo(-cardWidth / 2, cardHeight / 2, -cardWidth / 2, cardHeight / 2 - cardCornerRadius);
cardShape.lineTo(-cardWidth / 2, -cardHeight / 2 + cardCornerRadius);
cardShape.quadraticCurveTo(-cardWidth / 2, -cardHeight / 2, -cardWidth / 2 + cardCornerRadius, -cardHeight / 2);

const cardExtrudeSettings = {
  depth: cardThickness,
  bevelEnabled: false,
  steps: 1
};
const cardBodyGeometry = new THREE.ExtrudeGeometry(cardShape, cardExtrudeSettings);
cardBodyGeometry.translate(0, 0, -cardThickness / 2);

const cardUvs = cardBodyGeometry.attributes.uv.array;
const cardPosition = cardBodyGeometry.attributes.position.array;
const cardBoundingBox = new THREE.Box3().setFromBufferAttribute(cardBodyGeometry.attributes.position);
const cardSize = new THREE.Vector3();
cardBoundingBox.getSize(cardSize);
const cardMin = cardBoundingBox.min;

for (let i = 0; i < cardPosition.length / 3; i++) {
  const x = cardPosition[i * 3];
  const y = cardPosition[i * 3 + 1];
  const z = cardPosition[i * 3 + 2];
  if (Math.abs(z - cardThickness / 2) < 0.001 || Math.abs(z + cardThickness / 2) < 0.001) {
    cardUvs[i * 2] = (x - cardMin.x) / cardSize.x;
    cardUvs[i * 2 + 1] = (y - cardMin.y) / cardSize.y;
  } else {
    cardUvs[i * 2] = (x - cardMin.x) / cardSize.x;
    cardUvs[i * 2 + 1] = (z + cardThickness / 2) / cardThickness;
  }
}
cardBodyGeometry.attributes.uv.needsUpdate = true;

const cardCanvas = document.createElement('canvas');
cardCanvas.width = 512;
cardCanvas.height = 512;
const cardContext = cardCanvas.getContext('2d');

cardContext.fillStyle = 'rgba(0, 0, 0, 0)';
cardContext.fillRect(0, 0, cardCanvas.width, cardCanvas.height);

const cardImg = new Image();
cardImg.crossOrigin = 'Anonymous';
cardImg.src = 'p.png';
const cardDetailsTexture = new THREE.CanvasTexture(cardCanvas);
cardDetailsTexture.needsUpdate = true;

const cardRainbowCanvas = document.createElement('canvas');
cardRainbowCanvas.width = 512;
cardRainbowCanvas.height = 512;
const cardRainbowContext = cardRainbowCanvas.getContext('2d');

const bakeCardRainbowTexture = () => {
  const imageData = cardRainbowContext.createImageData(512, 512);
  const data = imageData.data;

  const rainbowColor = (t) => {
    const r = Math.sin(t * 6.28318 + 0.0) * 0.8 + 0.2;
    const g = Math.sin(t * 6.28318 + 2.09439) * 0.8 + 0.2;
    const b = Math.sin(t * 6.28318 + 4.18879) * 0.8 + 0.2;
    return [r * 255, g * 255, b * 255];
  };

  const random = (x, y) => {
    return Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123 % 1;
  };
  const cardNoise = (x, y) => {
    const iX = Math.floor(x);
    const iY = Math.floor(y);
    const fX = x - iX;
    const fY = y - iY;
    const a = random(iX, iY);
    const b = random(iX + 1, iY);
    const c = random(iX, iY + 1);
    const d = random(iX + 1, iY + 1);
    const uX = fX * fX * (3.0 - 2.0 * fX);
    const uY = fY * fY * (3.0 - 2.0 * fY);
    return a * (1 - uX) * (1 - uY) +
           b * uX * (1 - uY) +
           c * (1 - uX) * uY +
           d * uX * uY;
  };

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const v = y / 512;
      const rainbowOffset = u + v;
      const [r, g, b] = rainbowColor(rainbowOffset);
      const noiseValue = cardNoise(u * 10, v * 10);
      const finalR = r * (1 - 0.3) + (r * noiseValue) * 0.3;
      const finalG = g * (1 - 0.3) + (g * noiseValue) * 0.3;
      const finalB = b * (1 - 0.3) + (b * noiseValue) * 0.3;

      const index = (y * 512 + x) * 4;
      data[index] = finalR;
      data[index + 1] = finalG;
      data[index + 2] = finalB;
      data[index + 3] = 255;
    }
  }
  cardRainbowContext.putImageData(imageData, 0, 0);

  const cardFinalCanvas = document.createElement('canvas');
  cardFinalCanvas.width = 512;
  cardFinalCanvas.height = 512;
  const cardFinalContext = cardFinalCanvas.getContext('2d');

  cardFinalContext.drawImage(cardRainbowCanvas, 0, 0);
  cardFinalContext.globalCompositeOperation = 'source-over';
  cardFinalContext.drawImage(cardCanvas, 0, 0);

  cardDetailsTexture.image = cardFinalCanvas;
  cardDetailsTexture.needsUpdate = true;
};

// Use TextureLoader with LoadingManager
const textureLoader = new THREE.TextureLoader(manager);
textureLoader.load('p.png', (texture) => {
  cardImg.src = texture.image.src;
}, undefined, (error) => {
  console.error('Error loading texture p.png:', error);
});

cardImg.onload = () => {
  const maxWidth = 180;
  const maxHeight = 180;
  let width = cardImg.width;
  let height = cardImg.height;

  if (width > height) {
    if (width > maxWidth) {
      height = height * (maxWidth / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = width * (maxHeight / height);
      height = maxHeight;
    }
  }

  const x = 10;
  const y = (cardCanvas.height - height) / 2;
  cardContext.drawImage(cardImg, x, y, width, height);

  const textStartX = 190;
  cardContext.fillStyle = '#000000';
  cardContext.font = 'bold 30px Courier New';
  cardContext.textAlign = 'left';
  cardContext.fillText('Syam Satish P', textStartX, 210);

  cardContext.fillStyle = '#000000';
  cardContext.font = '20px Courier New';
  cardContext.fillText('Creative Developer', textStartX, 250);

  cardContext.fillStyle = '#000000';
  cardContext.font = '18px Courier New';
  cardContext.fillText('syamsatishpolipalli@gmail.com', textStartX, 290);

  cardContext.font = '16px Courier New';
  cardContext.fillStyle = '#0a66c2';
  cardContext.fillText('LinkedIn', textStartX, 330);
  cardContext.fillStyle = '#cccccc';
  cardContext.fillText('GitHub - Shyam1029', textStartX + 100, 330);

  cardDetailsTexture.needsUpdate = true;
  bakeCardRainbowTexture();
};

cardImg.onerror = () => {
  cardContext.fillStyle = '#888888';
  cardContext.fillRect(50, (cardCanvas.height - 150) / 2, 150, 150);
  cardContext.fillStyle = '#ffffff';
  cardContext.font = '20px Arial';
  cardContext.textAlign = 'center';
  cardContext.fillText('Image Failed', 125, cardCanvas.height / 2 + 5);

  const textStartX = 190;
  cardContext.fillStyle = '#000000';
  cardContext.font = 'bold 30px Courier New';
  cardContext.textAlign = 'left';
  cardContext.fillText('Syam Satish P', textStartX, 210);

  cardContext.fillStyle = '#000000';
  cardContext.font = '20px Courier New';
  cardContext.fillText('Creative Developer', textStartX, 250);

  cardContext.fillStyle = '#000000';
  cardContext.font = '18px Courier New';
  cardContext.fillText('syamsatishpolipalli@gmail.com', textStartX, 290);

  cardContext.font = '16px Courier New';
  cardContext.fillStyle = '#0a66c2';
  cardContext.fillText('LinkedIn', textStartX, 330);
  cardContext.fillStyle = '#cccccc';
  cardContext.fillText('GitHub - Shyam1029', textStartX + 100, 330);

  cardDetailsTexture.needsUpdate = true;
  bakeCardRainbowTexture();
};

const cardCrystalMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform samplerCube envMap;
    uniform sampler2D detailsTexture;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    vec3 hueToRGB(float hue) {
      float r = abs(hue * 6.0 - 3.0) - 1.0;
      float g = 2.0 - abs(hue * 6.0 - 2.0);
      float b = 2.0 - abs(hue * 6.0 - 4.0);
      return clamp(vec3(r, g, b), 0.0, 1.0);
    }

    void main() {
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - dot(vNormal, viewDir), 3.0);
      fresnel = clamp(fresnel, 0.0, 1.0);

      float iridescenceSpeed = 0.5;
      float hue = fract((vUv.x + vUv.y) * 0.5 + time * iridescenceSpeed);
      vec3 iridescentColor = hueToRGB(hue);
      vec3 baseColor = vec3(0.9, 0.9, 1.0);
      vec3 color = mix(baseColor, iridescentColor, 0.7);

      vec3 reflectDir = reflect(-viewDir, vNormal);
      vec3 envColor = textureCube(envMap, reflectDir).rgb;
      color = mix(color, envColor, 0.4);

      color += vec3(0.5, 0.6, 1.0) * fresnel * 0.5;

      float glowIntensity = 0.2;
      float glowPulse = sin(time * 0.5) * 0.5 + 0.5;
      color += iridescentColor * glowIntensity * glowPulse;

      vec4 details = texture2D(detailsTexture, vUv);
      if (details.a > 0.0) {
        float shadow = smoothstep(0.0, 0.1, details.a);
        vec3 textColor = mix(vec3(0.0), details.rgb, shadow);
        color = mix(color, textColor, details.a * 0.9);
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `,
  uniforms: {
    time: { value: 0 },
    envMap: { value: cardEnvMap },
    detailsTexture: { value: cardDetailsTexture }
  },
  side: THREE.DoubleSide
});

const cardBodyMesh = new THREE.Mesh(cardBodyGeometry, cardCrystalMaterial);
cardBodyMesh.castShadow = true;
cardBodyMesh.receiveShadow = true;

const intro_card = new THREE.Group();
intro_card.add(cardBodyMesh);
intro_card.position.set(70, 110, 71);
intro_card.rotation.y = Math.PI / 4;
intro_card.userData = { baseY: 50 };
intro_card.scale.set(5, 5, 5);
scene.add(intro_card);

//
// OBJECTS
//
const waterGeometry = new THREE.PlaneGeometry(floorParams.size, floorParams.size, 128, 128);
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    uniform float time;
    uniform float amplitude;
    uniform float noiseScale;
    uniform vec3 sunPosition;
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      float n = snoise(vec3(pos.x * noiseScale, pos.y * noiseScale, time));
      pos.z += n * amplitude;
      vElevation = pos.z;
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

      vec3 tangent = vec3(1.0, 0.0, 0.0);
      vec3 bitangent = vec3(0.0, 1.0, 0.0);
      float dx = snoise(vec3((pos.x + 0.01) * noiseScale, pos.y * noiseScale, time)) * amplitude - vElevation;
      float dy = snoise(vec3(pos.x * noiseScale, (pos.y + 0.01) * noiseScale, time)) * amplitude - vElevation;
      tangent.z = dx / 0.01;
      bitangent.z = dy / 0.01;
      vNormal = normalize(cross(bitangent, tangent));

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 sunPosition;
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vec3 color = mix(vec3(0.0, 0.5, 0.8), vec3(0.0, 0.8, 1.0), vElevation * 0.5 + 0.5);
      vec3 toSun = normalize(sunPosition - vWorldPosition);
      float lightIntensity = max(dot(vNormal, toSun), 0.0);
      lightIntensity = pow(lightIntensity, 10.0);
      vec3 highlightColor = vec3(1.0, 1.0, 0.9);
      color = mix(color, highlightColor, lightIntensity * 0.2);
      float distToSun = length(sunPosition.xz - vWorldPosition.xz);
      float glow = 1.0 - smoothstep(0.0, 50.0, distToSun);
      color += vec3(0.2, 0.2, 0.1) * glow;
      gl_FragColor = vec4(color, 0.7);
    }
  `,
  uniforms: {
    time: { value: 0 },
    amplitude: { value: waterParams.amplitude },
    noiseScale: { value: waterParams.noiseScale },
    sunPosition: { value: sunPosition }
  },
  side: THREE.DoubleSide,
  transparent: true
});
const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
waterMesh.rotation.x = -Math.PI / 2;
scene.add(waterMesh);

const floorGeometry = new THREE.PlaneGeometry(floorParams.size, floorParams.size, 128, 128);
const floorMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying float vElevation;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    void main() {
      vElevation = position.z;
      vUv = uv;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 sunPosition;
    uniform float floorElevation;
    varying float vElevation;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    void main() {
      vec3 biscuit = vec3(210.0/255.0, 180.0/255.0, 140.0/255.0);
      vec3 brown = vec3(139.0/255.0, 69.0/255.0, 19.0/255.0);
      float mixFactor = (vElevation + floorElevation) / (floorElevation * 2.0);
      vec3 color = mix(biscuit, brown, mixFactor);

      vec3 toSun = sunPosition - vWorldPosition;
      float distToSun = length(toSun.xz);
      float causticIntensity = 1.0 - smoothstep(0.0, 50.0, distToSun);
      vec3 refractPos = vWorldPosition + toSun * 0.1;
      float causticNoise = snoise(vec3(refractPos.x * 0.1, refractPos.z * 0.1, time * 0.5));
      causticIntensity *= (causticNoise * 0.5 + 0.5);
      vec3 causticColor = vec3(1.0, 1.0, 0.9);
      color += causticColor * causticIntensity * 0.5;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
  uniforms: {
    time: { value: 0 },
    sunPosition: { value: sunPosition },
    floorElevation: { value: floorParams.elevation }
  }
});
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = floorParams.depth;
floorMesh.receiveShadow = true;

const positions = floorGeometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const y = positions.getY(i);
  const elevation = noise.noise2D(x * 0.05, y * 0.05) * floorParams.elevation;
  positions.setZ(i, elevation);
}
positions.needsUpdate = true;
floorGeometry.computeVertexNormals();
scene.add(floorMesh);

const sunGeometry = new THREE.SphereGeometry(7.5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF99 });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.copy(sunPosition);
// scene.add(sunMesh);

//
// CORAL MODELS
//
const coralModelPaths = [
  './assets/corals/crescent_moon_coral.glb',
  './assets/corals/coral_piece.glb',
  './assets/corals/coral_reef_3_l.glb',
  './assets/corals/coral_tree.glb',
  './assets/corals/coral_azul.glb',
  './assets/corals/coral_flower.glb',
  './assets/corals/coral_l.glb',
  './assets/corals/coral-coral_roof.glb',
  './assets/corals/corals.glb',
];

const defaultScales = [
  20, 1.6, 6.8, 0.7, 1.6, 1.8, 5.7, 0.1, 2.7
];

const loader = new GLTFLoader(manager);

let crown;

loader.load(
  './assets/sculptures/crown.glb',
  (gltf) => {
    crown = gltf.scene;

    crown.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!(child.material instanceof THREE.MeshStandardMaterial)) {
          child.material = new THREE.MeshStandardMaterial({
            color: child.material.color || 0xffffff,
            metalness: 0.8,
            roughness: 0.2
          });
        }
      }
    });

    crown.position.copy(sunPosition);
    crown.rotation.y = -Math.PI / 2;
    crown.scale.set(2, 2, 2);
    crown.userData = { baseY: -25 };
    crown.castShadow = true;
    crown.receiveShadow = true;
    scene.add(crown);
  },
  undefined,
  (error) => {
    console.error(`Error loading crown:`, error);
  }
);


let coralModels = [];
let coralInstanceList = [];

Promise.all(
  coralModelPaths.map((path, index) =>
    new Promise((resolve, reject) => {
      loader.load(
        path,
        (glb) => {
          const model = glb.scene;
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          coralModels[index] = model;
          coralInstanceList[index] = [];
          resolve();
        },
        undefined,
        (error) => {
          console.error(`Error loading coral model ${path}:`, error);
          reject(error);
        }
      );
    })
  )
).then(() => {
  const coralGroup = new THREE.Group();
  const instancesPerModel = 20;
  const minDistance = 10;

  const placedPositions = [];
  coralModels.forEach((model, modelIndex) => {
    if (!model) return;

    for (let i = 0; i < instancesPerModel; i++) {
      let x, z, isOverlapping;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        x = (Math.random() - 0.5) * floorParams.size * 0.8;
        z = (Math.random() - 0.5) * floorParams.size * 0.8;
        isOverlapping = false;

        for (const pos of placedPositions) {
          const distance = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
          if (distance < minDistance) {
            isOverlapping = true;
            break;
          }
        }

        attempts++;
        if (attempts > maxAttempts) {
          console.warn(`Could not place instance ${i} of coral model ${modelIndex} without overlap after ${maxAttempts} attempts.`);
          break;
        }
      } while (isOverlapping);

      if (attempts > maxAttempts) continue;

      const elevation = noise.noise2D(x * 0.05, z * 0.05) * floorParams.elevation;
      const y = floorParams.depth + elevation;

      const modelInstance = model.clone();
      modelInstance.position.set(x, y, z);
      modelInstance.scale.set(defaultScales[modelIndex], defaultScales[modelIndex], defaultScales[modelIndex]);
      modelInstance.rotation.y = 0;
      coralGroup.add(modelInstance);

      coralInstanceList[modelIndex].push(modelInstance);
      placedPositions.push({ x, z });
    }
  });

  scene.add(coralGroup);
}).catch((error) => {
  console.error('Failed to load coral models:', error);
});

//
// FISH MODELS
//
const fishModelPaths = [
  './assets/fish/fish_1.glb',
  './assets/fish/fish_2.glb'
];

const fishGroup = new THREE.Group();
scene.add(fishGroup);

const fishInstancesPerModel = 20;
let fishInstances = [];
let fishMixers = [];

Promise.all(
  fishModelPaths.flatMap((path, modelIndex) =>
    Array(fishInstancesPerModel).fill().map((_, instanceIndex) =>
      new Promise((resolve, reject) => {
        loader.load(
          path,
          (gltf) => {
            const model = gltf.scene;
            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            const x = (Math.random() - 0.5) * floorParams.size * 0.8;
            const z = (Math.random() - 0.5) * floorParams.size * 0.8;
            const y = (Math.random() * 15) - 20;
            model.position.set(x, y, z);

            const initialScale = modelIndex === 0 ? 10 : 5;
            model.scale.set(initialScale, initialScale, initialScale);
            model.userData = {
              speed: Math.random() * 0.5 + 0.2,
              direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
            };
            fishGroup.add(model);

            let mixer = null;
            if (gltf.animations && gltf.animations.length > 0) {
              mixer = new THREE.AnimationMixer(model);
              const swimClip = gltf.animations.find((clip) =>
                clip.name.toLowerCase().includes("swim")
              ) || gltf.animations[0];
              const action = mixer.clipAction(swimClip);
              action.play();
            } else {
              console.warn(`No animations found for fish model ${path}`);
            }

            fishInstances.push(model);
            fishMixers.push(mixer);
            resolve();
          },
          undefined,
          (error) => {
            console.error(`Error loading fish model ${path}:`, error);
            reject(error);
          }
        );
      })
    )
  )
).then(() => {
}).catch((error) => {
  console.error('Failed to load fish models:', error);
});

//
// TREASURE CHEST
//
const treasureChestPath = './assets/sculptures/treasure.glb';
const treasureChestScale = 0.04;

let treasureChest = null;

new Promise((resolve, reject) => {
  loader.load(
    treasureChestPath,
    (gltf) => {
      treasureChest = gltf.scene;
      treasureChest.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      treasureChest.position.set(52, -20, 46);
      treasureChest.scale.set(treasureChestScale, treasureChestScale, treasureChestScale);
      treasureChest.rotation.y = Math.PI / 4;
      treasureChest.userData = { baseY: -25 };
      scene.add(treasureChest);
      resolve();
    },
    undefined,
    (error) => {
      console.error(`Error loading treasure chest ${treasureChestPath}:`, error);
      reject(error);
    }
  );
}).catch((error) => {
  console.error('Failed to load treasure chest:', error);
});

//
// CORAL COLONIES (PROJECTS AND SKILLS)
//
const coralPositions = [
  { type: "project", title: "", description: "", pos: new THREE.Vector3(-50, 0, -20) },
  { type: "project", title: "", description: "", pos: new THREE.Vector3(0, 0, -60) },
  { type: "skill", title: "", description: "", pos: new THREE.Vector3(50, 0, -100) },
  { type: "skill", title: "", description: "", pos: new THREE.Vector3(-30, 0, -140) }
];

let corals = [];
coralPositions.forEach(item => {
  const coralGroup = new THREE.Group();
  const coralHeight = item.type === "project" ? 5 : 3;
  const coralColor = item.type === "project" ? 0xFF6347 : 0x4682B4;
  const coralGeometry = new THREE.CylinderGeometry(0.5, 2, coralHeight, 8);
  const coralMaterial = new THREE.MeshStandardMaterial({ color: coralColor, roughness: 0.8 });
  const coralMesh = new THREE.Mesh(coralGeometry, coralMaterial);
  coralMesh.position.y = coralHeight / 2;
  coralMesh.castShadow = true;
  coralMesh.receiveShadow = true;
  coralGroup.add(coralMesh);

  const textCanvas = document.createElement('canvas');
  textCanvas.width = 512;
  textCanvas.height = 256;
  const context = textCanvas.getContext('2d');
  context.fillStyle = 'rgba(255, 255, 255, 0)';
  context.fillRect(0, 0, 512, 256);
  context.fillStyle = '#000000';
  context.font = 'bold 30px Arial';
  context.textAlign = 'center';
  context.fillText(item.title, 256, 80);
  context.font = '20px Arial';
  context.fillText(item.description, 256, 150);
  const textTexture = new THREE.CanvasTexture(textCanvas);
  const labelGeometry = new THREE.PlaneGeometry(10, 5);
  const labelMaterial = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true });
  const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
  labelMesh.position.y = coralHeight + 3;
  coralGroup.add(labelMesh);

  const floorHeight = noise.noise2D(item.pos.x * 0.05, item.pos.z * 0.05) * floorParams.elevation;
  coralGroup.position.set(item.pos.x, floorParams.depth + floorHeight, item.pos.z);
  coralGroup.userData = { baseY: floorParams.depth + floorHeight + coralHeight / 2 };
  scene.add(coralGroup);
  corals.push(coralGroup);
});

//
// EVENT LISTENERS
//
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  composer.setSize(sizes.width, sizes.height); // ← Add this
});

//
// ANIMATION LOOP
//
const animation = () => {
  const delta = 0.016;
  time = clock.getElapsedTime();

  waterMaterial.uniforms.time.value = time * waterParams.speed;
  floorMaterial.uniforms.time.value = time;
  cardCrystalMaterial.uniforms.time.value = time;

  fishInstances.forEach((fish, index) => {
    fish.position.add(fish.userData.direction.clone().multiplyScalar(fish.userData.speed * 0.1));
    if (fish.position.x > floorParams.size / 2 || fish.position.x < -floorParams.size / 2 ||
        fish.position.z > floorParams.size / 2 || fish.position.z < -floorParams.size / 2) {
      fish.userData.direction.multiplyScalar(-1);
    }
    fish.rotation.y = Math.atan2(fish.userData.direction.x, fish.userData.direction.z);

    const mixer = fishMixers[index];
    if (mixer) {
      mixer.update(delta);
    }
  });

  corals.forEach(coral => {
    const baseY = coral.userData.baseY;
    coral.children[0].position.y = baseY + Math.sin(time + coral.position.x) * 0.2;
  });

  // controls.update();
  lenis.raf(time * 1000);

  composer.render(); // ← This replaces renderer.render
  requestAnimationFrame(animation);
};

animation();
