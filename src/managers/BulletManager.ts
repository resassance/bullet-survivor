import * as THREE from 'three';
import { BULLET, ARENA } from '../utils/constants';

/**
 * Данные одной пули в пуле. Не THREE.Object3D — просто числа,
 * никакой GPU/GC-нагрузки на "мёртвых" пулях.
 */
export interface BulletSlot {
  x: number;
  y: number;
  z: number;
  alive: boolean;
}

/**
 * Управляет автострельбой игрока вдоль -Z.
 *
 * Архитектура — object pool + InstancedMesh:
 * - Фиксированный массив слотов создаётся один раз (BULLET.POOL_SIZE),
 *   дальше никаких `new`/`dispose()` в рантайме — только переключение
 *   флага `alive`. Это и есть тот pooling, о котором договаривались:
 *   без него GC-паузы волнами убивали бы фреймрейт на мобилках.
 * - Каждый кадр живые пули упаковываются в начало instance-буфера,
 *   `mesh.count` обрезается до их числа — GPU рисует ровно столько
 *   инстансов, сколько реально летит, одним draw call'ом.
 */
export class BulletManager {
  public readonly mesh: THREE.InstancedMesh;
  public readonly slots: BulletSlot[] = [];

  private dummy = new THREE.Object3D();
  private fireCooldown = 0;
  private nextFreeHint = 0; // ring-buffer подсказка, чтобы не сканировать пул с нуля каждый раз

  constructor() {
    const geometry = new THREE.CapsuleGeometry(
      BULLET.RADIUS,
      BULLET.LENGTH,
      4,
      8
    );
    // Капсула по умолчанию вытянута вдоль Y — разворачиваем геометрию
    // один раз при создании, чтобы дальше матрицы инстансов содержали
    // только translation (без rotation) — дешевле каждый кадр.
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
      color: BULLET.COLOR,
      toneMapped: false, // сохраняем чистый яркий цвет — важно для Bloom на шаге 7
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, BULLET.POOL_SIZE);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0; // активных пуль пока нет — не рендерим ничего
    this.mesh.frustumCulled = false; // пули разбросаны по всей глубине арены, авто-culling тут бесполезен

    for (let i = 0; i < BULLET.POOL_SIZE; i++) {
      this.slots.push({ x: 0, y: 0, z: 0, alive: false });
    }
  }

  public update(delta: number, playerPosition: THREE.Vector3): void {
    this.handleFiring(delta, playerPosition);
    this.moveAndDespawn(delta);
    this.syncInstances();
  }

  private handleFiring(delta: number, playerPosition: THREE.Vector3): void {
    this.fireCooldown -= delta;
    if (this.fireCooldown > 0) return;

    this.fireCooldown += 1 / BULLET.FIRE_RATE;
    this.spawnBullet(playerPosition);
  }

  private spawnBullet(playerPosition: THREE.Vector3): void {
    const slot = this.findFreeSlot();
    if (!slot) return; // пул исчерпан — пропускаем выстрел, не крашимся

    slot.alive = true;
    slot.x = playerPosition.x;
    slot.y = BULLET.SPAWN_HEIGHT;
    slot.z = playerPosition.z;
  }

  private findFreeSlot(): BulletSlot | null {
    for (let i = 0; i < BULLET.POOL_SIZE; i++) {
      const index = (this.nextFreeHint + i) % BULLET.POOL_SIZE;
      if (!this.slots[index].alive) {
        this.nextFreeHint = (index + 1) % BULLET.POOL_SIZE;
        return this.slots[index];
      }
    }
    return null;
  }

  private moveAndDespawn(delta: number): void {
    for (const slot of this.slots) {
      if (!slot.alive) continue;
      slot.z -= BULLET.SPEED * delta;
      if (slot.z < ARENA.BULLET_DESPAWN_Z) {
        slot.alive = false;
      }
    }
  }

  private syncInstances(): void {
    let renderIndex = 0;
    for (const slot of this.slots) {
      if (!slot.alive) continue;
      this.dummy.position.set(slot.x, slot.y, slot.z);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(renderIndex, this.dummy.matrix);
      renderIndex++;
    }
    this.mesh.count = renderIndex;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
