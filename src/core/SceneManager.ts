import * as THREE from 'three';
import { BACKGROUND_COLOR, FOG } from '../utils/constants';

/**
 * Оборачивает THREE.Scene, отвечает за фон и туман.
 * Отдельно от Game.ts, чтобы визуальные настройки атмосферы
 * (депрессивный/дединсайд-вайб) можно было крутить в одном месте.
 */
export class SceneManager {
  public readonly scene: THREE.Scene;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BACKGROUND_COLOR);
    this.scene.fog = new THREE.FogExp2(FOG.COLOR, FOG.DENSITY);
  }

  public add(object: THREE.Object3D): void {
    this.scene.add(object);
  }
}
