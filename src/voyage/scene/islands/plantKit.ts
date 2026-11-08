import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, BufferAttribute, type BufferGeometry, Mesh, type MeshStandardMaterial, Vector3 } from 'three';
import { stylise } from '../materials';
import { withBase } from '../../../lib/url';

// "Date palm and vegetation" by Bársh, CC-BY-4.0 (credited on the About page).
const PLANTS_URL = withBase('models/palms.glb');
useGLTF.preload(PLANTS_URL);

export type Plant = { geometry: BufferGeometry; material: MeshStandardMaterial; height: number };

/** Bakes a mesh into a standalone geometry whose base (lowest vertices) sits at the origin. */
function rooted(mesh: Mesh): BufferGeometry {
  mesh.updateWorldMatrix(true, false);
  const g = mesh.geometry.clone();
  // Compressed models store attributes as normalised integers (values in -1..1, scaled back by the
  // node transform). Baking the transform into them would clamp everything, so convert to floats first.
  for (const name of Object.keys(g.attributes)) {
    const a = g.attributes[name] as BufferAttribute;
    if (!a.normalized && a.array instanceof Float32Array) continue;
    const out = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let c = 0; c < a.itemSize; c++) out[i * a.itemSize + c] = a.getComponent(i, c);
    g.setAttribute(name, new BufferAttribute(out, a.itemSize));
  }
  g.applyMatrix4(mesh.matrixWorld);
  const pos = g.attributes.position;
  const box = new Box3().setFromBufferAttribute(pos as never);
  // Centre on the trunk/stem: the vertices within 0.3 of the ground.
  const base = new Vector3();
  let n = 0;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < box.min.y + 0.3) {
      base.x += pos.getX(i);
      base.z += pos.getZ(i);
      n++;
    }
  }
  base.divideScalar(Math.max(n, 1));
  g.translate(-base.x, -box.min.y, -base.z);
  g.computeBoundingSphere();
  return g;
}

/** The three date palms and the small bushes/grass from the vegetation pack, ready to scatter. */
export function usePlantKit() {
  const { scene } = useGLTF(PLANTS_URL);
  return useMemo(() => {
    const palms: Plant[] = [];
    const bushes: Plant[] = [];
    scene.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const material = o.material as MeshStandardMaterial;
      if (!material.userData.stylised) {
        const isPalm = o.name.includes('DatePalm');
        // Leaves sway more toward the crown; bushes and grass ripple gently.
        stylise(material, isPalm ? { amount: 0.5, base: 2.2, height: 3 } : { amount: 0.25, base: 0, height: 1 });
        material.userData.stylised = true;
      }
      const geometry = rooted(o);
      const height = geometry.boundingSphere ? geometry.boundingSphere.radius * 2 : 1;
      (o.name.includes('DatePalm') ? palms : bushes).push({ geometry, material, height });
    });
    return { palms, bushes };
  }, [scene]);
}
