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

    const segmentCount = Math.ceil(COVER.WIDTH / COVER.SEGMENT_WIDTH);
    const actualSegmentWidth = COVER.WIDTH / segmentCount;
    const startX = -COVER.WIDTH / 2 + actualSegmentWidth / 2;

    for (let i = 0; i < segmentCount; i++) {
      const segmentX = startX + i * actualSegmentWidth;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(actualSegmentWidth * 0.94, COVER.HEIGHT, COVER.DEPTH),
        bodyMaterial
      );
      body.position.set(segmentX, COVER.HEIGHT / 2, 0);
      this.group.add(body);

      const strapTop = new THREE.Mesh(
        new THREE.BoxGeometry(actualSegmentWidth * 0.98, 0.08, COVER.DEPTH + 0.04),
        strapMaterial
      );
      strapTop.position.set(segmentX, COVER.HEIGHT * 0.78, 0);
      this.group.add(strapTop);
    }

    this.group.position.set(0, 0, COVER.Z_OFFSET);
  }
}
