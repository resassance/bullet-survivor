import * as THREE from 'three';

/**
 * Разворачивает object так, чтобы он "смотрел" на камеру,
 * но вращение применяется ТОЛЬКО вокруг оси Y.
 * Это даёт классический 2.5D billboard-эффект (Diablo/Hades-style):
 * спрайт всегда стоит вертикально, не заваливается при наклонной камере.
 */
export function billboardYAxis(
  object: THREE.Object3D,
  camera: THREE.Camera
): void {
  const dx = camera.position.x - object.position.x;
  const dz = camera.position.z - object.position.z;
  object.rotation.y = Math.atan2(dx, dz);
}
