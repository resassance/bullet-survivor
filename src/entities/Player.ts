import * as THREE from 'three';
import { PLAYER } from '../utils/constants';
import { billboardYAxis } from '../utils/billboard';
import { createSilhouettePlaceholder } from '../utils/placeholderTexture';

/**
 * Персонаж игрока: 2D billboard-спрайт (PlaneGeometry) в 3D-пространстве.
 * Двигается ТОЛЬКО по оси X, плавно интерполируя к целевой позиции
 * (см. InputManager.targetX). Позиция Z фиксирована — персонаж
 * всегда стоит на "передней линии" арены.
 *
 * Текстура сейчас — плейсхолдер (см. utils/placeholderTexture.ts),
 * заменяется на финальный спрайт через `mesh.material.map = texture`.
 */
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
      alphaTest: 0.1, // отсекаем прозрачные пиксели, чтобы не мешали сортировке
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);

    // Пивот геометрии — по центру, поднимаем так, чтобы "ноги" были на полу (y=0)
    this.mesh.position.set(0, PLAYER.HEIGHT / 2, PLAYER.SPAWN_Z);
  }

  /**
   * @param delta      время с прошлого кадра, сек
   * @param targetX    целевая X-позиция (из InputManager)
   * @param camera     нужна для billboard-разворота
   */
  public update(
    delta: number,
    targetX: number,
    camera: THREE.Camera
  ): void {
    // Экспоненциальный lerp, независимый от FPS:
    // на каждом кадре "проходим" (1 - e^-k*dt) долю оставшегося расстояния
    const smoothing = 1 - Math.exp(-PLAYER.MOVE_SMOOTHING * delta);
    this.mesh.position.x += (targetX - this.mesh.position.x) * smoothing;

    billboardYAxis(this.mesh, camera);
  }
}
