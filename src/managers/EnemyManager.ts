import * as THREE from 'three';
import { ENEMY, ARENA } from '../utils/constants';
import { createSilhouettePlaceholder } from '../utils/placeholderTexture';

export interface EnemySlot {
  x: number;
  y: number;
  z: number;
  alive: boolean;
  health: number;
}

/**
 * Управляет ордой эфириалов: спавн волнами на Z = ARENA.ENEMY_SPAWN_Z,
 * движение к игроку (+Z с лёгким хоумингом по X), billboard-разворот
 * к камере. Архитектура та же, что у BulletManager — пул слотов
 * + InstancedMesh, без runtime-аллокаций.
 */
export class EnemyManager {
  public readonly mesh: THREE.InstancedMesh;
  public readonly slots: EnemySlot[] = [];

  private dummy = new THREE.Object3D();
  private spawnCooldown = ENEMY.SPAWN_INTERVAL;

  constructor() {
    const geometry = new THREE.PlaneGeometry(ENEMY.WIDTH, ENEMY.HEIGHT);
    // Поднимаем пивот геометрии так, чтобы "ноги" врага стояли на полу —
    // тогда в матрице инстанса position.y всегда равен 0, проще считать.
    geometry.translate(0, ENEMY.HEIGHT / 2, 0);

    const texture = createSilhouettePlaceholder({
      glowColor: '#ff2d55', // кроваво-неоновый контур — под тематику "эфириалов"
      fillColor: '#12060a',
      label: 'ETHEREAL',
    });

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, ENEMY.POOL_SIZE);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false; // враги разбросаны по всей глубине арены

    for (let i = 0; i < ENEMY.POOL_SIZE; i++) {
      this.slots.push({ x: 0, y: 0, z: 0, alive: false, health: 0 });
    }
  }

  public update(
    delta: number,
    playerPosition: THREE.Vector3,
    camera: THREE.Camera
  ): void {
    this.handleSpawning(delta);
    this.moveEnemies(delta, playerPosition);
    this.syncInstances(camera);
  }

  private handleSpawning(delta: number): void {
    this.spawnCooldown -= delta;
    if (this.spawnCooldown > 0) return;
    this.spawnCooldown += ENEMY.SPAWN_INTERVAL;

    const count = THREE.MathUtils.randInt(
      ENEMY.SPAWN_COUNT_MIN,
      ENEMY.SPAWN_COUNT_MAX
    );
    for (let i = 0; i < count; i++) {
      this.spawnEnemy();
    }
  }

  private spawnEnemy(): void {
    const slot = this.findFreeSlot();
    if (!slot) return; // пул исчерпан — пропускаем спавн, не крашимся

    slot.alive = true;
    slot.health = ENEMY.HEALTH;
    slot.x = THREE.MathUtils.randFloatSpread(ENEMY.SPAWN_X_SPREAD);
    slot.y = 0;
    slot.z = ARENA.ENEMY_SPAWN_Z;
  }

  private findFreeSlot(): EnemySlot | null {
    for (const slot of this.slots) {
      if (!slot.alive) return slot;
    }
    return null;
  }

  private moveEnemies(delta: number, playerPosition: THREE.Vector3): void {
    for (const slot of this.slots) {
      if (!slot.alive) continue;

      slot.z += ENEMY.SPEED * delta;

      // Хоуминг по X: орда доворачивает на игрока, но не мгновенно —
      // от неё всё ещё можно уклониться смещением, а не только стрельбой.
      const homingFactor = 1 - Math.exp(-ENEMY.HOMING_STRENGTH * delta);
      slot.x += (playerPosition.x - slot.x) * homingFactor;

      if (slot.z > ENEMY.DESPAWN_Z) {
        slot.alive = false; // safety net: прошёл мимо игрока, не столкнувшись
      }
    }
  }

  private syncInstances(camera: THREE.Camera): void {
    let renderIndex = 0;
    for (const slot of this.slots) {
      if (!slot.alive) continue;

      this.dummy.position.set(slot.x, slot.y, slot.z);

      const dx = camera.position.x - slot.x;
      const dz = camera.position.z - slot.z;
      this.dummy.rotation.set(0, Math.atan2(dx, dz), 0);
      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(renderIndex, this.dummy.matrix);
      renderIndex++;
    }
    this.mesh.count = renderIndex;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
