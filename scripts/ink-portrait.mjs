// Bakes the wanted-poster portrait: turns a private photo into an engraved ink drawing
// (transparent PNG) so only the drawing is ever committed or published.
// Usage: node scripts/ink-portrait.mjs [private/captain-photo.jpg] [public/images/captain-ink.png]
//
// Pipeline: cover-fit at 2x resolution -> contrast stretch + local contrast boost ->
// XDoG (eXtended Difference of Gaussians) for clean, artist-like ink lines ->
// anti-aliased engraving hatches whose width follows tone -> transparent PNG in ink brown.
import { readFileSync, writeFileSync } from 'node:fs';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

const [input = 'private/captain-photo.jpg', output = 'public/images/captain-ink.png'] = process.argv.slice(2);
const W = 960;
const H = 800;
const INK = [38, 24, 12];

const img = jpeg.decode(readFileSync(input), { useTArray: true });

// ---- Resample to W x H (cover-fit, biased upward so the hair stays in frame) ----
const s = Math.max(W / img.width, H / img.height);
const ox = (W - img.width * s) / 2;
const oy = (H - img.height * s) * 0.12;
const srcLum = (x, y) => {
  const i = (Math.min(img.height - 1, Math.max(0, y)) * img.width + Math.min(img.width - 1, Math.max(0, x))) * 4;
  return (0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]) / 255;
};
let lum = new Float32Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const sx = (x - ox) / s, sy = (y - oy) / s;
    const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
    const top = srcLum(x0, y0) * (1 - fx) + srcLum(x0 + 1, y0) * fx;
    const bot = srcLum(x0, y0 + 1) * (1 - fx) + srcLum(x0 + 1, y0 + 1) * fx;
    lum[y * W + x] = top * (1 - fy) + bot * fy;
  }
}

// ---- Separable Gaussian blur ----
function blur(src, sigma) {
  const r = Math.ceil(sigma * 3);
  const k = Array.from({ length: r * 2 + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const sum = k.reduce((a, b) => a + b, 0);
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let v = 0;
      for (let i = -r; i <= r; i++) v += src[y * W + Math.min(W - 1, Math.max(0, x + i))] * k[i + r];
      tmp[y * W + x] = v / sum;
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let v = 0;
      for (let i = -r; i <= r; i++) v += tmp[Math.min(H - 1, Math.max(0, y + i)) * W + x] * k[i + r];
      out[y * W + x] = v / sum;
    }
  return out;
}

// ---- Tone: contrast stretch, then local contrast (unsharp mask) so eyes and brows pop ----
const sorted = Array.from(lum).sort((a, b) => a - b);
const lo = sorted[Math.floor(sorted.length * 0.03)];
const hi = sorted[Math.floor(sorted.length * 0.97)];
lum = lum.map((v) => Math.min(1, Math.max(0, (v - lo) / Math.max(hi - lo, 1e-3))));
const wide = blur(lum, 18);
const tone = lum.map((v, i) => Math.min(1, Math.max(0, v + (v - wide[i]) * 0.8)));

// ---- XDoG ink lines ----
const g1 = blur(tone, 1.0);
const g2 = blur(tone, 1.0 * 1.6);
const lines = new Float32Array(W * H);
for (let i = 0; i < lines.length; i++) {
  const d = g1[i] - 0.985 * g2[i];
  // Soft threshold: ink where the DoG drops below epsilon, with a smooth tanh falloff.
  lines[i] = d < -0.007 ? Math.min(1, Math.tanh((-0.007 - d) * 110)) : 0;
}

// ---- Engraving hatches (anti-aliased, width follows darkness) ----
const smooth = blur(tone, 1.5); // smoother tone for hatching, so lines don't jitter
const coverage = (dist, halfWidth) => Math.min(1, Math.max(0, halfWidth - dist + 0.5));
const png = new PNG({ width: W, height: H });
const P = 7; // hatch period in px
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const dark = Math.pow(1 - smooth[i], 2.1); // light skin stays bare paper
    const wob = Math.sin(y * 0.045 + x * 0.01) * 1.4;
    // Distance to the nearest hatch line for three directions.
    const d1 = Math.abs((((x + y) * Math.SQRT1_2 + wob) % P + P) % P - P / 2);
    const d2 = Math.abs((((x - y) * Math.SQRT1_2 + wob + 1000) % P + P) % P - P / 2);
    const d3 = Math.abs(((y + wob * 0.5) % P + P) % P - P / 2);
    const h1 = dark > 0.16 ? coverage(d1, (dark - 0.1) * P * 0.45) : 0;
    const h2 = dark > 0.4 ? coverage(d2, (dark - 0.4) * P * 0.75) : 0;
    const h3 = dark > 0.65 ? coverage(d3, (dark - 0.65) * P * 1.1) : 0;
    const ink = Math.max(lines[i], h1 * 0.8, h2 * 0.85, h3 * 0.9);
    png.data.set([INK[0], INK[1], INK[2], Math.round(Math.min(1, ink) * 245)], i * 4);
  }
}
writeFileSync(output, PNG.sync.write(png, { colorType: 6 }));
console.log(`wrote ${output}`);
