import * as THREE from 'three';
import { BULLET, BULLET_LIMITS, ARENA } from '../utils/constants';

export interface BulletSlot {
  x: number;
  y: number;
  z: number;
  alive: boolean;
  pierceRemaining: number;
}

export class BulletManager {
  public readonly mesh: THREE.InstancedMesh;
  public readonly slots: BulletSlot[] = [];

  private dummy = new THREE.Object3D();
  private fireCooldown = 0;
  private burstShotsRemaining = 0;
  private burstTimer = 0;
  private nextFreeHint = 0;

  private fireRate = BULLET.FIRE_RATE;
  private bulletSpeed = BULLET.SPEED;
  private bulletsPerShot = 1;
  private pierceCount = 0;
  public damage = BULLET.DAMAGE;
  public poisonStacks = 0;

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
      this.slots.push({ x: 0, y: 0, z: 0, alive: false, pierceRemaining: 0 });
    }
  }

  public update(delta: number, playerPosition: THREE.Vector3): void {
    this.handleFiring(delta, playerPosition);
    this.moveAndDespawn(delta);
    this.syncInstances();
  }

  private handleFiring(delta: number, playerPosition: THREE.Vector3): void {
    if (this.burstShotsRemaining > 0) {
      this.burstTimer -= delta;
      if (this.burstTimer <= 0) {
        this.burstTimer += BULLET.BURST_INTERVAL;
        this.fireSingleBullet(playerPosition);
        this.burstShotsRemaining -= 1;
      }
      return;
    }

    this.fireCooldown -= delta;
    if (this.fireCooldown > 0) return;

    this.fireCooldown += 1 / this.fireRate;
    this.fireSingleBullet(playerPosition);
    this.burstShotsRemaining = this.bulletsPerShot - 1;
    this.burstTimer = BULLET.BURST_INTERVAL;
  }

  private fireSingleBullet(playerPosition: THREE.Vector3): void {
    const slot = this.findFreeSlot();
    if (!slot) return;

    slot.alive = true;
    slot.x = playerPosition.x + THREE.MathUtils.randFloatSpread(BULLET.VOLLEY_SPREAD);
    slot.y = BULLET.SPAWN_HEIGHT;
    slot.z = playerPosition.z;
    slot.pierceRemaining = this.pierceCount;
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
    this.fireRate = Math.min(this.fireRate * multiplier, BULLET_LIMITS.MAX_FIRE_RATE);
  }

  public addBulletsPerShot(amount: number): void {
    this.bulletsPerShot = Math.min(
      this.bulletsPerShot + amount,
      BULLET_LIMITS.MAX_BULLETS_PER_SHOT
    );
  }

  public increaseDamage(amount: number): void {
    this.damage = Math.min(this.damage + amount, BULLET_LIMITS.MAX_DAMAGE);
  }

  public increaseBulletSpeed(multiplier: number): void {
    this.bulletSpeed = Math.min(
      this.bulletSpeed * multiplier,
      BULLET_LIMITS.MAX_BULLET_SPEED
    );
  }

  public increasePierce(amount: number): void {
    this.pierceCount = Math.min(this.pierceCount + amount, BULLET_LIMITS.MAX_PIERCE);
  }

  public addPoisonStacks(amount: number): void {
    this.poisonStacks = Math.min(
      this.poisonStacks + amount,
      BULLET_LIMITS.MAX_POISON_STACKS
    );
  }

  public reset(): void {
    for (const slot of this.slots) {
      slot.alive = false;
      slot.pierceRemaining = 0;
    }
    this.mesh.count = 0;
    this.fireCooldown = 0;
    this.burstShotsRemaining = 0;
    this.burstTimer = 0;
    this.nextFreeHint = 0;
    this.fireRate = BULLET.FIRE_RATE;
    this.bulletSpeed = BULLET.SPEED;
    this.bulletsPerShot = 1;
    this.pierceCount = 0;
    this.damage = BULLET.DAMAGE;
    this.poisonStacks = 0;
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
