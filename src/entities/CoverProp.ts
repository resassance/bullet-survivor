import * as THREE from 'three';
import { COVER } from '../utils/constants';

export class CoverProp {
  public readonly group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b2a1f,
      roughness: 0.95,
      metalness: 0.05,
    });
    const strapMaterial = new THREE.MeshStandardMaterial({
      color: 0x151310,
      roughness: 0.8,
      metalness: 0.2,
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(COVER.WIDTH, COVER.HEIGHT, COVER.DEPTH),
      bodyMaterial
    );
    body.position.y = COVER.HEIGHT / 2;
    this.group.add(body);

    const strapGeometry = new THREE.BoxGeometry(COVER.WIDTH + 0.04, 0.08, COVER.DEPTH + 0.04);
    const strapTop = new THREE.Mesh(strapGeometry, strapMaterial);
    strapTop.position.y = COVER.HEIGHT * 0.75;
    this.group.add(strapTop);

    const strapBottom = new THREE.Mesh(strapGeometry, strapMaterial);
    strapBottom.position.y = COVER.HEIGHT * 0.25;
    this.group.add(strapBottom);

    this.group.position.set(0, 0, COVER.Z_OFFSET);
  }

  public update(playerX: number): void {
    this.group.position.x = playerX;
  }
}
