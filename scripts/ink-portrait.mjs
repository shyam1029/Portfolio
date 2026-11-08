// Bakes the wanted-poster portrait: turns a private photo into an engraved ink drawing
// (transparent PNG) so only the drawing is ever committed or published.
// Usage: node scripts/ink-portrait.mjs [private/captain-photo.jpg] [public/images/captain-ink.png]
import { readFileSync, writeFileSync } from 'node:fs';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

const [input = 'private/captain-photo.jpg', output = 'public/images/captain-ink.png'] = process.argv.slice(2);
const W = 480;
const H = 400;
const INK = [42, 26, 12];

const img = jpeg.decode(readFileSync(input), { useTArray: true });

// Cover-fit, biased toward the top so the hair stays in frame; bilinear sampling to luminance.
const s = Math.max(W / img.width, H / img.height);
const ox = (W - img.width * s) / 2;
const oy = (H - img.height * s) * 0.12;
const lumAt = (x, y) => {
  const i = (Math.min(img.height - 1, Math.max(0, y)) * img.width + Math.min(img.width - 1, Math.max(0, x))) * 4;
  return (0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2]) / 255;
};
const lum = new Float32Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const sx = (x - ox) / s;
    const sy = (y - oy) / s;
    const x0 = Math.floor(sx), y0 = Math.floor(sy);
    const fx = sx - x0, fy = sy - y0;
    const top = lumAt(x0, y0) * (1 - fx) + lumAt(x0 + 1, y0) * fx;
    const bottom = lumAt(x0, y0 + 1) * (1 - fx) + lumAt(x0 + 1, y0 + 1) * fx;
    lum[y * W + x] = top * (1 - fy) + bottom * fy;
  }
}

// Stretch contrast between the 4th and 96th percentile.
const sorted = Array.from(lum).sort((a, b) => a - b);
const lo = sorted[Math.floor(sorted.length * 0.04)];
const hi = sorted[Math.floor(sorted.length * 0.96)];
for (let i = 0; i < lum.length; i++) lum[i] = Math.min(1, Math.max(0, (lum[i] - lo) / Math.max(hi - lo, 1e-3)));

const png = new PNG({ width: W, height: H });
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    const dark = Math.pow(1 - lum[i], 1.45); // ease mid-tones so skin stays light
    const gx = lum[i - W + 1] + 2 * lum[i + 1] + lum[i + W + 1] - lum[i - W - 1] - 2 * lum[i - 1] - lum[i + W - 1];
    const gy = lum[i + W - 1] + 2 * lum[i + W] + lum[i + W + 1] - lum[i - W - 1] - 2 * lum[i - W] - lum[i - W + 1];
    const edge = Math.min(1, Math.hypot(gx, gy) * 1.6);
    // Diagonal hatching that thickens with darkness; cross-hatch and horizontals in the shadows.
    const wobble = Math.sin(y * 0.09) * 1.2;
    const h1 = Math.abs(((x + y + wobble) % 6) - 3) / 3 < dark * 0.95 ? 1 : 0;
    const h2 = dark > 0.55 && Math.abs(((x - y + 600) % 6) - 3) / 3 < (dark - 0.55) * 1.8 ? 1 : 0;
    const h3 = dark > 0.82 && y % 4 < 2 ? 1 : 0;
    const ink = Math.max(edge > 0.35 ? edge : 0, h1 * 0.85, h2 * 0.9, h3);
    png.data.set([INK[0], INK[1], INK[2], Math.round(Math.min(1, ink) * 235)], i * 4);
  }
}
writeFileSync(output, PNG.sync.write(png));
console.log(`wrote ${output}`);
