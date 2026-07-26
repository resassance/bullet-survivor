import * as THREE from 'three';

export function billboardYAxis(
  object: THREE.Object3D,
  camera: THREE.Camera
): void {
  const dx = camera.position.x - object.position.x;
  const dz = camera.position.z - object.position.z;
  object.rotation.y = Math.atan2(dx, dz);
}
