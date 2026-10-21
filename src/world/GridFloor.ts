import * as THREE from 'three';
import { GRID, ARENA } from '../utils/constants';
import { tryLoadTiledTexture } from '../utils/textureLoader';

export class GridFloor {
  public readonly group: THREE.Group;
  private floorMaterial: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();

    const gridHelper = new THREE.GridHelper(
      GRID.SIZE,
      GRID.DIVISIONS,
      GRID.COLOR_MAIN,
      GRID.COLOR_SECONDARY
    );
    gridHelper.position.z = -ARENA.DEPTH / 2 + 10;
    this.group.add(gridHelper);

    const floorGeometry = new THREE.PlaneGeometry(GRID.SIZE, GRID.SIZE);
    this.floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x353d3b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.position.z = gridHelper.position.z;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Worn lane markings give the floodlights a grounded surface to pick out.
    const paint = new THREE.MeshStandardMaterial({ color: 0x888673, roughness: 1, transparent: true, opacity: 0.32, depthWrite: false });
    for (const x of [-6.5, 6.5]) {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.09, ARENA.DEPTH), paint);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, 0.006, -ARENA.DEPTH / 2);
      edge.receiveShadow = true;
      this.group.add(edge);
    }
    for (let z = -5; z > -ARENA.DEPTH; z -= 7) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2.2), paint);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.006, z);
      dash.receiveShadow = true;
      this.group.add(dash);
    }

    tryLoadTiledTexture('/assets/textures/floor-arena.jpg', 20, 20, (texture) => {
      this.floorMaterial.map = texture;
      this.floorMaterial.color.setHex(0xffffff);
      this.floorMaterial.needsUpdate = true;
    });
  }
}

