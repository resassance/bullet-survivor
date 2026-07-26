import * as THREE from 'three';
import { BULLET, ARENA } from '../utils/constants';

export interface BulletSlot {
  x: number;
  y: number;
  z: number;
  alive: boolean;
}

export class BulletManager {
  public readonly mesh: THREE.InstancedMesh;
  public readonly slots: BulletSlot[] = [];

  private dummy = new THREE.Object3D();
  private fireCooldown = 0;
  private nextFreeHint = 0;

  private fireRate = BULLET.FIRE_RATE;
  private bulletSpeed = BULLET.SPEED;
  private bulletsPerShot = 1;
  public damage = BULLET.DAMAGE;

  constructor() {
    const geometry = new THREE.CapsuleGeometry(
      BULLET.RADIUS,
      BULLET.LENGTH,
      4,
      8
    );
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
      color: BULLET.COLOR,
      toneMapped: false,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, BULLET.POOL_SIZE);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;

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

    this.fireCooldown += 1 / this.fireRate;
    this.spawnVolley(playerPosition);
  }

  private spawnVolley(playerPosition: THREE.Vector3): void {
    const count = this.bulletsPerShot;
    const spread = 0.22;
    const startOffset = -((count - 1) * spread) / 2;

    for (let i = 0; i < count; i++) {
      const slot = this.findFreeSlot();
      if (!slot) return;

      slot.alive = true;
      slot.x = playerPosition.x + startOffset + i * spread;
      slot.y = BULLET.SPAWN_HEIGHT;
      slot.z = playerPosition.z;
    }
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
      slot.z -= this.bulletSpeed * delta;
      if (slot.z < ARENA.BULLET_DESPAWN_Z) {
        slot.alive = false;
      }
    }
  }

  public increaseFireRate(multiplier: number): void {
    this.fireRate *= multiplier;
  }

  public addBulletsPerShot(amount: number): void {
    this.bulletsPerShot += amount;
  }

  public increaseDamage(amount: number): void {
    this.damage += amount;
  }

  public increaseBulletSpeed(multiplier: number): void {
    this.bulletSpeed *= multiplier;
  }

  public reset(): void {
    for (const slot of this.slots) {
      slot.alive = false;
    }
    this.mesh.count = 0;
    this.fireCooldown = 0;
    this.nextFreeHint = 0;
    this.fireRate = BULLET.FIRE_RATE;
    this.bulletSpeed = BULLET.SPEED;
    this.bulletsPerShot = 1;
    this.damage = BULLET.DAMAGE;
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
