import * as THREE from 'three';
import type { CampAssetDefinition } from '../gameplay/campLayout';
import { tryLoadTexture } from '../utils/textureLoader';

/** A fixed vertical plane; its parent's origin is the asset's ground contact. */
export function createCampCutout(
  asset: CampAssetDefinition,
  fallback?: THREE.Object3D
): THREE.Group {
  const group = new THREE.Group();
  if (fallback) {
    fallback.traverse(object => {
      if (object instanceof THREE.Mesh && !asset.unlit && !(object.material instanceof THREE.MeshBasicMaterial)) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    // Schematic geometry uses the same layout box and ground pivot as final art.
    const bounds = new THREE.Box3().setFromObject(fallback);
    const size = bounds.getSize(new THREE.Vector3());
    const fit = Math.min(asset.width / Math.max(size.x, 0.001), asset.height / Math.max(size.y, 0.001));
    const [pivotX, pivotY] = asset.pivot ?? [0.5, 0];
    const schematic = new THREE.Group();
    schematic.add(fallback);
    schematic.scale.setScalar(fit);
    schematic.position.set(-(bounds.min.x + size.x * pivotX) * fit, -(bounds.min.y + size.y * pivotY) * fit, 0);
    group.add(schematic);
    fallback = schematic;
  }
  if (!asset.path) return group;

  tryLoadTexture(asset.path, (texture) => {
    const [pivotX, pivotY] = asset.pivot ?? [0.5, 0];
    // Fit artwork inside its layout box without stretching a replacement image.
    const image = texture.image as HTMLImageElement;
    const aspect = image.width / image.height;
    const width = Math.min(asset.width, asset.height * aspect);
    const height = width / aspect;
    const geometry = new THREE.PlaneGeometry(width, height);
    geometry.translate((0.5 - pivotX) * width, (0.5 - pivotY) * height, 0);
    const surface = {
      map: texture,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: true,
      side: THREE.DoubleSide,
    };
    const material = asset.unlit
      ? new THREE.MeshBasicMaterial({ ...surface, toneMapped: false })
      : new THREE.MeshStandardMaterial({ ...surface, roughness: 1, metalness: 0, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: 0.08 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'camp-cutout';
    mesh.castShadow = !asset.unlit;
    mesh.receiveShadow = !asset.unlit;
    group.add(mesh);
    // Keep a failed or pending load usable; replace geometry only after success.
    if (fallback) fallback.visible = false;
  });
  return group;
}
