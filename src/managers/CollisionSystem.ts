import * as THREE from 'three';
import { BulletManager } from './BulletManager';
import { EnemyManager } from './EnemyManager';
import { BULLET, ENEMY, COLLISION } from '../utils/constants';

export interface CollisionCallbacks {
  /** Вызывается при смерти врага — точка расширения под дроп экспы (шаг 6) */
  onEnemyKilled?: (x: number, y: number, z: number) => void;
  /** Вызывается при контакте врага с игроком — точка расширения под HP-систему */
  onPlayerHit?: () => void;
}

/**
 * Проверка столкновений: пуля↔враг и враг↔игрок.
 * Дистанционная проверка (circle collision) по XZ-плоскости —
 * для 2.5D-спрайтов этого достаточно, полноценный AABB избыточен.
 *
 * Сложность: O(пули × враги) брутфорсом. При текущих размерах пулов
 * (300 × 150) это укладывается в бюджет кадра с большим запасом —
 * активных объектов одновременно на порядок меньше максимума пула.
 * Если позже понадобятся многие сотни врагов одновременно — есть
 * куда расти через spatial-хэш по Z-полосам, но для текущего масштаба
 * это была бы преждевременная оптимизация.
 */
export class CollisionSystem {
  private bulletManager: BulletManager;
  private enemyManager: EnemyManager;

  constructor(bulletManager: BulletManager, enemyManager: EnemyManager) {
    this.bulletManager = bulletManager;
    this.enemyManager = enemyManager;
  }

  public update(
    playerPosition: THREE.Vector3,
    callbacks: CollisionCallbacks = {}
  ): void {
    this.resolveBulletsVsEnemies(callbacks.onEnemyKilled);
    this.resolveEnemiesVsPlayer(playerPosition, callbacks.onPlayerHit);
  }

  private resolveBulletsVsEnemies(
    onEnemyKilled?: CollisionCallbacks['onEnemyKilled']
  ): void {
    const hitDistSq = (BULLET.RADIUS + ENEMY.COLLISION_RADIUS) ** 2;
    const bullets = this.bulletManager.slots;
    const enemies = this.enemyManager.slots;

    for (const bullet of bullets) {
      if (!bullet.alive) continue;

      for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const dx = bullet.x - enemy.x;
        const dz = bullet.z - enemy.z;
        if (dx * dx + dz * dz > hitDistSq) continue;

        bullet.alive = false;
        enemy.health -= BULLET.DAMAGE;

        if (enemy.health <= 0) {
          enemy.alive = false;
          onEnemyKilled?.(enemy.x, enemy.y, enemy.z);
        }

        break; // пуля потрачена; пробитие нескольких целей — будущий апгрейд ("Рикошет")
      }
    }
  }

  private resolveEnemiesVsPlayer(
    playerPosition: THREE.Vector3,
    onPlayerHit?: CollisionCallbacks['onPlayerHit']
  ): void {
    const hitDistSq = (COLLISION.PLAYER_RADIUS + ENEMY.COLLISION_RADIUS) ** 2;

    for (const enemy of this.enemyManager.slots) {
      if (!enemy.alive) continue;

      const dx = playerPosition.x - enemy.x;
      const dz = playerPosition.z - enemy.z;
      if (dx * dx + dz * dz > hitDistSq) continue;

      enemy.alive = false; // враг "разбивается" о игрока при контакте
      onPlayerHit?.();
    }
  }
}
