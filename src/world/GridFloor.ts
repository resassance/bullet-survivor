import * as THREE from 'three';
import { GRID, ARENA } from '../utils/constants';

/**
 * Неоновая сетка пола — базовый визуальный якорь арены.
 * Состоит из GridHelper (сама сетка) + светящейся плоскости
 * под ней для эффекта "свечения" в тумане.
 */
export class GridFloor {
  public readonly group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();

    const gridHelper = new THREE.GridHelper(
      GRID.SIZE,
      GRID.DIVISIONS,
      GRID.COLOR_MAIN,
      GRID.COLOR_SECONDARY
    );
    // сдвигаем сетку так, чтобы арена уходила вглубь (-Z),
    // а не была центрирована симметрично
    gridHelper.position.z = -ARENA.DEPTH / 2 + 10;
    this.group.add(gridHelper);

    // Тёмная база пола под сеткой, чтобы сквозь клетки не было видно фон
    const floorGeometry = new THREE.PlaneGeometry(GRID.SIZE, GRID.SIZE);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x08070f,
      roughness: 0.9,
      metalness: 0.1,
      emissive: new THREE.Color(GRID.EMISSIVE_COLOR),
      emissiveIntensity: 0.03,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01; // чуть ниже сетки, чтобы не было z-fighting
    floor.position.z = gridHelper.position.z;
    floor.receiveShadow = true;
    this.group.add(floor);
  }
}
