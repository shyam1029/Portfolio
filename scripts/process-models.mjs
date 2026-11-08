// Turns the raw downloads in models-src/ into web-ready GLBs in public/models/.
// Usage: node scripts/process-models.mjs
//
// Credits (CC-BY-4.0, shown on the About page):
// - "Stylized Pirate Ship" by Maksim Batyrev
//   https://sketchfab.com/3d-models/stylized-pirate-ship-1c62191534174bf7a67470fb02b97db1
// - "Date palm and vegetation" by Bársh
//   https://sketchfab.com/3d-models/date-palm-and-vegetation-734c4537ca8547209a54df49f134824a
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const tmp = 'models-src/.tmp';
mkdirSync(tmp, { recursive: true });
const kb = (p) => `${Math.round(statSync(p).size / 1024)} KB`;

/** Remove nodes whose name matches, plus their now-unused meshes/materials/textures. */
async function strip(input, output, { dropNodes = [], dropAttributes = [] }) {
  const doc = await io.read(input);
  for (const node of doc.getRoot().listNodes()) {
    if (dropNodes.some((re) => re.test(node.getName()))) node.dispose();
  }
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      for (const name of dropAttributes) prim.getAttribute(name)?.dispose();
    }
  }
  await doc.transform(prune());
  await io.write(output, doc);
}

function optimize(input, output) {
  execFileSync(
    'npx',
    ['gltf-transform', 'optimize', input, output, '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024', '--simplify', 'false', '--join', 'false'],
    { stdio: 'inherit' },
  );
}

await strip('models-src/stylized_pirate_ship/scene.gltf', `${tmp}/ship.glb`, { dropNodes: [/^WaterPlane/] });
optimize(`${tmp}/ship.glb`, 'public/models/ship.glb');

await strip('models-src/date_palm_and_vegetation.glb', `${tmp}/palms.glb`, { dropAttributes: ['TEXCOORD_1', 'TEXCOORD_2'] });
optimize(`${tmp}/palms.glb`, 'public/models/palms.glb');

console.log(`ship.glb ${kb('public/models/ship.glb')}, palms.glb ${kb('public/models/palms.glb')}`);
