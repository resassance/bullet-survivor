import * as THREE from 'three';
import type { CampAssetDefinition } from '../gameplay/campLayout';
import { tryLoadTexture } from '../utils/textureLoader';

/** A fixed vertical plane; its parent's origin is the asset's ground contact. */
export function createCampCutout(
  asset: CampAssetDefinition,
  fallback?: THREE.Object3D
): THREE.Group {
  const group = new THREE.Group();
  if (fallback) group.add(fallback);
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
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'camp-cutout';
    group.add(mesh);
    // Keep a failed or pending load usable; replace geometry only after success.
    if (fallback) fallback.visible = false;
  });
  return group;
}
