import * as THREE from 'three';
import { PLAYER } from '../utils/constants';
import { billboardYAxis } from '../utils/billboard';
import { createSilhouettePlaceholder } from '../utils/placeholderTexture';

export class Player {
  public readonly mesh: THREE.Mesh;

  constructor() {
    const geometry = new THREE.PlaneGeometry(PLAYER.WIDTH, PLAYER.HEIGHT);

    const texture = createSilhouettePlaceholder({
      glowColor: '#9b7fff',
      fillColor: '#1a1430',
      label: 'PLAYER',
    });

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, PLAYER.HEIGHT / 2, PLAYER.SPAWN_Z);
  }

  public update(
    delta: number,
    targetX: number,
    camera: THREE.Camera
  ): void {
    const smoothing = 1 - Math.exp(-PLAYER.MOVE_SMOOTHING * delta);
    this.mesh.position.x += (targetX - this.mesh.position.x) * smoothing;

    billboardYAxis(this.mesh, camera);
  }

  public resetPosition(): void {
    this.mesh.position.set(0, PLAYER.HEIGHT / 2, PLAYER.SPAWN_Z);
  }
}
