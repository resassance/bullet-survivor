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
      color: 0x08070f,
      roughness: 0.9,
      metalness: 0.1,
      emissive: new THREE.Color(GRID.EMISSIVE_COLOR),
      emissiveIntensity: 0.03,
    });
    const floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.position.z = gridHelper.position.z;
    floor.receiveShadow = true;
    this.group.add(floor);

    tryLoadTiledTexture('/assets/textures/floor-arena.jpg', 20, 20, (texture) => {
      this.floorMaterial.map = texture;
      this.floorMaterial.color.setHex(0xffffff);
      this.floorMaterial.needsUpdate = true;
    });
  }
}
