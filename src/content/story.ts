// The whole story lives here: chapters, captain's log lines, colours and camera framing.
// Scroll progress runs from 0 (top of the page) to 1 (bottom).

export type Palette = {
  skyTop: string;
  skyBottom: string; // also the fog colour, so the horizon blends seamlessly
  sun: string;
  sunIntensity: number;
  sunDir: [number, number, number];
  ambient: string;
  ambientIntensity: number;
  waterDeep: string;
  waterShallow: string;
  foam: string;
  cloud: string;
  stars: number; // 0..1
  storm: number; // 0..1, drives waves, rain and lightning
};

export type CameraFraming = {
  /** Offset from the ship in its own frame: [right, up, behind]. Keep the camera on the side away from the island so ship and island share the frame. */
  offset: [number, number, number];
  /** 0 = look ahead along the route, 1 = look straight at this chapter's island. */
  lookAtIsland: number;
};

export type LogLine = { text: string; at: [number, number] };

export type ChapterId = 'spark' | 'arcade' | 'academy' | 'discovery' | 'storm' | 'horizon';

export type Chapter = {
  id: ChapterId;
  title: string;
  place: string;
  range: [number, number];
  /** Which side of the route the island sits on (1 = starboard, -1 = port, 0 = no island). */
  islandSide: 1 | -1 | 0;
  islandRadius: number;
  log: LogLine[];
  palette: Palette;
  camera: CameraFraming;
};

export const captain = {
  name: 'Syam Satish',
  epithet: 'The Learner',
  role: 'Creative developer',
  bounty: '1,029,000',
  dream: 'Be innovative. Try, and learn as much as possible.',
  email: 'syamsatishpolipalli@gmail.com',
  github: 'https://github.com/shyam1029',
  linkedin: 'https://www.linkedin.com/in/syam-satish-polipalli-507864250',
};

export const games = [
  { title: 'AetherRush', blurb: 'Sci-fi flight through asteroid fields.', url: 'https://shyam1029.github.io/Three.js---6/' },
  { title: 'Endless Space Runner', blurb: 'Dodge, collect, survive.', url: 'https://shyam1029.github.io/Three.js---4/' },
  { title: 'Luxe Cars', blurb: 'Luxury cars in interactive 3D.', url: 'https://shyam1029.github.io/Three.js---3.2/' },
];

export const chapters: Chapter[] = [
  {
    id: 'spark',
    title: 'The Spark',
    place: 'Lantern Harbour',
    range: [0, 0.12],
    islandSide: 1,
    islandRadius: 18,
    log: [
      { text: 'Every voyage starts with a spark.', at: [0.0, 0.06] },
      { text: 'Mine was a glowing screen, and worlds I could step into.', at: [0.06, 0.12] },
    ],
    palette: {
      skyTop: '#0b1640', skyBottom: '#2a3f7a', sun: '#a9bdff', sunIntensity: 0.7, sunDir: [-0.3, 0.8, 0.4],
      ambient: '#4a5fa3', ambientIntensity: 0.9, waterDeep: '#0a2348', waterShallow: '#1d4f86', foam: '#9fc3ff',
      cloud: '#4a5a8a', stars: 1, storm: 0,
    },
    camera: { offset: [-8, 5, 17], lookAtIsland: 0.55 },
  },
  {
    id: 'arcade',
    title: 'Arcade Isle',
    place: 'Where the games live',
    range: [0.12, 0.3],
    islandSide: -1,
    islandRadius: 22,
    log: [
      { text: 'I spent my childhood inside games.', at: [0.13, 0.16] },
      { text: 'Then I started wondering how they were made.', at: [0.16, 0.19] },
      { text: 'So I built my own. Click a bottle to play one.', at: [0.19, 0.3] },
    ],
    palette: {
      skyTop: '#2f8fea', skyBottom: '#9fd3f2', sun: '#fff1d0', sunIntensity: 1.7, sunDir: [0.4, 0.85, 0.3],
      ambient: '#cfe9ff', ambientIntensity: 0.8, waterDeep: '#0b5d9a', waterShallow: '#1fb2c8', foam: '#ffffff',
      cloud: '#ffffff', stars: 0, storm: 0,
    },
    camera: { offset: [16, 13, 30], lookAtIsland: 0.65 },
  },
  {
    id: 'academy',
    title: 'The Academy',
    place: 'Lighthouse Point',
    range: [0.3, 0.46],
    islandSide: 1,
    islandRadius: 18,
    log: [
      { text: 'That curiosity steered me into computer science.', at: [0.31, 0.38] },
      { text: 'Four years of fundamentals. A map I still read every day.', at: [0.38, 0.46] },
    ],
    palette: {
      skyTop: '#3b3a8f', skyBottom: '#ff9f72', sun: '#ffb37a', sunIntensity: 1.5, sunDir: [-0.8, 0.25, -0.4],
      ambient: '#d6a4c0', ambientIntensity: 0.9, waterDeep: '#2b3f7f', waterShallow: '#d67a74', foam: '#ffd9c4',
      cloud: '#ffc2a6', stars: 0.25, storm: 0,
    },
    camera: { offset: [-15, 7, 27], lookAtIsland: 0.45 },
  },
  {
    id: 'discovery',
    title: 'The Discovery',
    place: 'Wireframe Isle',
    range: [0.46, 0.64],
    islandSide: -1,
    islandRadius: 24,
    log: [
      { text: 'In my final year I found three.js, and the browser became an ocean.', at: [0.47, 0.55] },
      { text: 'An internship followed. I finished as one of the cohort’s outstanding performers.', at: [0.55, 0.64] },
    ],
    palette: {
      skyTop: '#140f4a', skyBottom: '#45cfc6', sun: '#b0fff6', sunIntensity: 1.5, sunDir: [0.2, 0.7, -0.6],
      ambient: '#8fdde3', ambientIntensity: 1.0, waterDeep: '#0b3a66', waterShallow: '#1fb3b0', foam: '#c8fff7',
      cloud: '#9ad7e6', stars: 0.6, storm: 0,
    },
    camera: { offset: [13, 15, 34], lookAtIsland: 0.55 },
  },
  {
    id: 'storm',
    title: 'The Engine Room',
    place: 'Engine Harbour',
    range: [0.64, 0.82],
    islandSide: 1,
    islandRadius: 22,
    log: [
      { text: 'Next, I steered into rougher waters on purpose: the engine room of the web.', at: [0.65, 0.71] },
      { text: 'At Novio I build backends: the engines, pipes and servers that keep everything afloat.', at: [0.71, 0.76] },
      { text: 'Master the engine, and you can build the whole ship, not just the sails.', at: [0.76, 0.82] },
    ],
    palette: {
      skyTop: '#23282f', skyBottom: '#5b6570', sun: '#b8c4cc', sunIntensity: 0.6, sunDir: [0.1, 0.9, 0.2],
      ambient: '#7c8794', ambientIntensity: 0.9, waterDeep: '#1b2a33', waterShallow: '#3b5562', foam: '#d0dde3',
      cloud: '#4d5560', stars: 0, storm: 1,
    },
    camera: { offset: [-9, 8, 22], lookAtIsland: 0.55 },
  },
  {
    id: 'horizon',
    title: 'The Horizon',
    place: 'Open sea',
    range: [0.82, 1],
    islandSide: 0,
    islandRadius: 0,
    log: [{ text: 'The voyage isn’t over.', at: [0.83, 0.9] }],
    palette: {
      skyTop: '#4f7fd6', skyBottom: '#f7b77e', sun: '#ffd38a', sunIntensity: 1.8, sunDir: [0, 0.12, -1],
      ambient: '#ffd7b0', ambientIntensity: 0.85, waterDeep: '#1f5aa8', waterShallow: '#4fb0d0', foam: '#fff4e0',
      cloud: '#ffe1c7', stars: 0, storm: 0,
    },
    camera: { offset: [6, 5, 24], lookAtIsland: 0 },
  },
];

/** When the dream and the wanted poster appear. */
export const finale = { dreamAt: 0.9, posterAt: 0.95 };
