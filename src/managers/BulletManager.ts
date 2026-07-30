import * as THREE from 'three';
import { BULLET, BULLET_LIMITS, ARENA } from '../utils/constants';
import { WEAPONS, findWeapon } from '../gameplay/weapons';
import type { WeaponDefinition } from '../gameplay/weapons';

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
  private material: THREE.MeshBasicMaterial;
  private fireCooldown = 0;
  private burstShotsRemaining = 0;
  private burstTimer = 0;
  private nextFreeHint = 0;

  private weapon: WeaponDefinition = WEAPONS[0];
  private fireRateMultiplier = 1;
  private damageBonus = 0;
  private bulletSpeedMultiplier = 1;
  private extraBurstShots = 0;
  private pierceCount = 0;
  private magazineBonus = 0;
  private currentAmmo = WEAPONS[0].magazineSize;
  private reloadTimer = 0;
  private reloading = false;
  public poisonStacks = 0;

  constructor() {
    const geometry = new THREE.CapsuleGeometry(
      BULLET.RADIUS,
      BULLET.LENGTH,
      4,
      8
    );
    geometry.rotateX(Math.PI / 2);

    this.material = new THREE.MeshBasicMaterial({
      color: this.weapon.color,
      toneMapped: false,
    });

    this.mesh = new THREE.InstancedMesh(geometry, this.material, BULLET.POOL_SIZE);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;

    for (let i = 0; i < BULLET.POOL_SIZE; i++) {
      this.slots.push({ x: 0, y: 0, z: 0, alive: false, pierceRemaining: 0 });
    }
  }

  public switchWeapon(weaponId: string): void {
    this.weapon = findWeapon(weaponId);
    this.material.color.setHex(this.weapon.color);
    this.currentAmmo = this.magazineCapacity;
    this.reloading = false;
    this.reloadTimer = 0;
    this.fireCooldown = 0;
    this.burstShotsRemaining = 0;
  }

  public update(
    delta: number,
    playerPosition: THREE.Vector3,
    onShotFired: () => void
  ): void {
    this.handleFiring(delta, playerPosition, onShotFired);
    this.moveAndDespawn(delta);
    this.syncInstances();
  }

  private handleFiring(
    delta: number,
    playerPosition: THREE.Vector3,
    onShotFired: () => void
  ): void {
    if (this.reloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        this.finishReload();
      }
      return;
    }

    if (this.burstShotsRemaining > 0) {
      this.burstTimer -= delta;
      if (this.burstTimer <= 0) {
        this.burstTimer += BULLET.BURST_INTERVAL;
        this.firePelletVolley(playerPosition);
        onShotFired();
        this.burstShotsRemaining -= 1;
      }
      return;
    }

    this.fireCooldown -= delta;
    if (this.fireCooldown > 0) return;

    if (this.currentAmmo <= 0) {
      this.startReload();
      return;
    }

    this.fireCooldown += 1 / this.fireRate;
    this.firePelletVolley(playerPosition);
    onShotFired();
    this.burstShotsRemaining = Math.min(this.extraBurstShots, this.currentAmmo);
    this.burstTimer = BULLET.BURST_INTERVAL;
  }

  private firePelletVolley(playerPosition: THREE.Vector3): void {
    const pelletCount = this.weapon.pelletCount;
    const spread = this.weapon.spread;

    for (let i = 0; i < pelletCount; i++) {
      const slot = this.findFreeSlot();
      if (!slot) continue;

      const offset =
        pelletCount === 1
          ? THREE.MathUtils.randFloatSpread(spread)
          : (i / (pelletCount - 1) - 0.5) * spread;

      slot.alive = true;
      slot.x = playerPosition.x + offset;
      slot.y = BULLET.SPAWN_HEIGHT;
      slot.z = playerPosition.z;
      slot.pierceRemaining = this.pierceCount;
    }

    this.currentAmmo -= 1;
    if (this.currentAmmo <= 0) {
      this.startReload();
    }
  }

  private startReload(): void {
    if (this.reloading) return;
    this.reloading = true;
    this.reloadTimer = this.weapon.reloadDuration;
    this.burstShotsRemaining = 0;
  }

  private finishReload(): void {
    this.reloading = false;
    this.currentAmmo = this.magazineCapacity;
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
    this.fireRateMultiplier = Math.min(
      this.fireRateMultiplier * multiplier,
      BULLET_LIMITS.MAX_FIRE_RATE / this.weapon.fireRate
    );
  }

  public addBulletsPerShot(amount: number): void {
    this.extraBurstShots = Math.min(
      this.extraBurstShots + amount,
      BULLET_LIMITS.MAX_BULLETS_PER_SHOT
    );
  }

  public increaseDamage(amount: number): void {
    this.damageBonus = Math.min(this.damageBonus + amount, BULLET_LIMITS.MAX_DAMAGE);
  }

  public increaseBulletSpeed(multiplier: number): void {
    this.bulletSpeedMultiplier = Math.min(
      this.bulletSpeedMultiplier * multiplier,
      BULLET_LIMITS.MAX_BULLET_SPEED / this.weapon.bulletSpeed
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

  public increaseMagazineSize(amount: number): void {
    this.magazineBonus = Math.min(
      this.magazineBonus + amount,
      BULLET_LIMITS.MAX_MAGAZINE_SIZE - this.weapon.magazineSize
    );
    this.currentAmmo = Math.min(this.currentAmmo + amount, this.magazineCapacity);
  }

  private get fireRate(): number {
    return Math.min(this.weapon.fireRate * this.fireRateMultiplier, BULLET_LIMITS.MAX_FIRE_RATE);
  }

  private get bulletSpeed(): number {
    return Math.min(
      this.weapon.bulletSpeed * this.bulletSpeedMultiplier,
      BULLET_LIMITS.MAX_BULLET_SPEED
    );
  }

  public get damage(): number {
    return Math.min(this.weapon.damage + this.damageBonus, BULLET_LIMITS.MAX_DAMAGE);
  }

  public get isReloading(): boolean {
    return this.reloading;
  }

  public get reloadProgress(): number {
    if (!this.reloading) return 1;
    return 1 - this.reloadTimer / this.weapon.reloadDuration;
  }

  public get ammo(): number {
    return this.currentAmmo;
  }

  public get magazineCapacity(): number {
    return Math.min(
      this.weapon.magazineSize + this.magazineBonus,
      BULLET_LIMITS.MAX_MAGAZINE_SIZE
    );
  }

  public get weaponName(): string {
    return this.weapon.name;
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
    this.weapon = WEAPONS[0];
    this.material.color.setHex(this.weapon.color);
    this.fireRateMultiplier = 1;
    this.bulletSpeedMultiplier = 1;
    this.extraBurstShots = 0;
    this.pierceCount = 0;
    this.damageBonus = 0;
    this.poisonStacks = 0;
    this.magazineBonus = 0;
    this.currentAmmo = this.magazineCapacity;
    this.reloading = false;
    this.reloadTimer = 0;
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
