import { BulletManager } from './BulletManager';
import { EnemyManager } from './EnemyManager';
import { BULLET, ENEMY, POISON } from '../utils/constants';

export interface CollisionCallbacks {
  onEnemyKilled?: (x: number, y: number, z: number) => void;
}

export class CollisionSystem {
  private bulletManager: BulletManager;
  private enemyManager: EnemyManager;

  constructor(bulletManager: BulletManager, enemyManager: EnemyManager) {
    this.bulletManager = bulletManager;
    this.enemyManager = enemyManager;
  }

  public update(callbacks: CollisionCallbacks = {}): void {
    this.resolveBulletsVsEnemies(callbacks.onEnemyKilled);
  }

  private resolveBulletsVsEnemies(
    onEnemyKilled?: CollisionCallbacks['onEnemyKilled']
  ): void {
    const hitDistSq = (BULLET.RADIUS + ENEMY.COLLISION_RADIUS) ** 2;
    const bullets = this.bulletManager.slots;
    const enemies = this.enemyManager.slots;
    const poisonStacks = this.bulletManager.poisonStacks;

    for (const bullet of bullets) {
      if (!bullet.alive) continue;

      for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const dx = bullet.x - enemy.x;
        const dz = bullet.z - enemy.z;
        if (dx * dx + dz * dz > hitDistSq) continue;

        enemy.health -= this.bulletManager.damage;
        enemy.hitFlashTimer = ENEMY.HIT_FLASH_DURATION;

        if (poisonStacks > 0) {
          this.enemyManager.applyPoison(
            enemy,
            POISON.DAMAGE_PER_TICK_PER_STACK * poisonStacks,
            POISON.TICK_COUNT,
            POISON.TICK_INTERVAL
          );
        }

        if (enemy.health <= 0) {
          enemy.alive = false;
          onEnemyKilled?.(enemy.x, enemy.y, enemy.z);
        }

        if (bullet.pierceRemaining > 0) {
          bullet.pierceRemaining -= 1;
          continue;
        }

        bullet.alive = false;
        break;
      }
    }
  }
}
