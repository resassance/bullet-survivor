import * as THREE from 'three';
import { LIGHTNING, WIND_SLASH, GRENADE, ARENA, ENEMY } from '../utils/constants';
import type { SpecialWeaponId } from '../gameplay/specialWeapons';
import type { EnemyManager } from './EnemyManager';

interface ProjectileSlot {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  alive: boolean;
  life: number;
}

export class SpecialWeaponManager {
  public readonly group: THREE.Group;

  private equipped: SpecialWeaponId | null = null;
  private cooldownTimer = 0;

  private lightningGroup: THREE.Group;
  private lightningSegments: THREE.Mesh[] = [];
  private lightningVisibleTimer = 0;

  private windMesh: THREE.InstancedMesh;
  private windSlots: ProjectileSlot[] = [];
  private windDummy = new THREE.Object3D();

  private grenadeMesh: THREE.InstancedMesh;
  private grenadeSlots: ProjectileSlot[] = [];
  private grenadeFuses: number[] = [];
  private grenadeDummy = new THREE.Object3D();

  constructor() {
    this.group = new THREE.Group();

    this.lightningGroup = new THREE.Group();
    const boltMaterial = new THREE.MeshBasicMaterial({
      color: LIGHTNING.COLOR,
      toneMapped: false,
    });
    for (let i = 0; i < LIGHTNING.SEGMENT_COUNT; i++) {
      const segment = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 1),
        boltMaterial
      );
      segment.visible = false;
      this.lightningSegments.push(segment);
      this.lightningGroup.add(segment);
    }
    this.group.add(this.lightningGroup);

    const windGeometry = new THREE.PlaneGeometry(0.7, 0.28);
    const windMaterial = new THREE.MeshBasicMaterial({
      color: WIND_SLASH.COLOR,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    this.windMesh = new THREE.InstancedMesh(windGeometry, windMaterial, WIND_SLASH.POOL_SIZE);
    this.windMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.windMesh.count = 0;
    this.windMesh.frustumCulled = false;
    this.group.add(this.windMesh);
    for (let i = 0; i < WIND_SLASH.POOL_SIZE; i++) {
      this.windSlots.push({ x: 0, y: 0, z: 0, vx: 0, vz: 0, alive: false, life: 0 });
    }

    const grenadeGeometry = new THREE.SphereGeometry(0.16, 8, 8);
    const grenadeMaterial = new THREE.MeshBasicMaterial({
      color: GRENADE.COLOR,
      toneMapped: false,
    });
    this.grenadeMesh = new THREE.InstancedMesh(grenadeGeometry, grenadeMaterial, GRENADE.POOL_SIZE);
    this.grenadeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.grenadeMesh.count = 0;
    this.grenadeMesh.frustumCulled = false;
    this.group.add(this.grenadeMesh);
    for (let i = 0; i < GRENADE.POOL_SIZE; i++) {
      this.grenadeSlots.push({ x: 0, y: 0, z: 0, vx: 0, vz: 0, alive: false, life: 0 });
      this.grenadeFuses.push(0);
    }
  }

  public equip(id: SpecialWeaponId | null): void {
    this.equipped = id;
    this.cooldownTimer = 0;
  }

  public get equippedId(): SpecialWeaponId | null {
    return this.equipped;
  }

  public get cooldownRatio(): number {
    if (!this.equipped) return 0;
    const cooldown = this.cooldownForEquipped();
    return cooldown > 0 ? 1 - Math.min(1, this.cooldownTimer / cooldown) : 1;
  }

  public update(
    delta: number,
    playerPosition: THREE.Vector3,
    enemyManager: EnemyManager,
    onKill: (x: number, y: number, z: number) => void,
    onExplode: (x: number, y: number, z: number) => void
  ): void {
    this.updateLightningVisual(delta);
    this.updateWindSlash(delta, enemyManager, onKill);
    this.updateGrenades(delta, enemyManager, onKill, onExplode);

    if (!this.equipped) return;

    this.cooldownTimer -= delta;
    if (this.cooldownTimer > 0) return;

    this.cooldownTimer = this.cooldownForEquipped();

    if (this.equipped === 'lightning') {
      this.triggerLightning(playerPosition, enemyManager, onKill);
    } else if (this.equipped === 'windSlash') {
      this.triggerWindSlash(playerPosition);
    } else if (this.equipped === 'grenade') {
      this.triggerGrenade(playerPosition);
    }
  }

  private cooldownForEquipped(): number {
    if (this.equipped === 'lightning') return LIGHTNING.COOLDOWN;
    if (this.equipped === 'windSlash') return WIND_SLASH.COOLDOWN;
    if (this.equipped === 'grenade') return GRENADE.COOLDOWN;
    return 0;
  }

  private triggerLightning(
    playerPosition: THREE.Vector3,
    enemyManager: EnemyManager,
    onKill: (x: number, y: number, z: number) => void
  ): void {
    const points: THREE.Vector3[] = [playerPosition.clone()];
    for (let i = 1; i <= LIGHTNING.SEGMENT_COUNT; i++) {
      const z = playerPosition.z + (LIGHTNING.RANGE_Z / LIGHTNING.SEGMENT_COUNT) * i;
      const x = playerPosition.x + THREE.MathUtils.randFloatSpread(LIGHTNING.JITTER_X);
      points.push(new THREE.Vector3(x, 1.2, z));
    }

    for (let i = 0; i < this.lightningSegments.length; i++) {
      const from = points[i];
      const to = points[i + 1];
      const segment = this.lightningSegments[i];

      const mid = from.clone().add(to).multiplyScalar(0.5);
      const distance = from.distanceTo(to);
      segment.position.copy(mid);
      segment.scale.set(1, 1, distance);
      segment.lookAt(to);
      segment.visible = true;
    }
    this.lightningVisibleTimer = LIGHTNING.VISIBLE_DURATION;

    const hitRadiusSq = LIGHTNING.HIT_RADIUS * LIGHTNING.HIT_RADIUS;
    for (const point of points) {
      for (const enemy of enemyManager.slots) {
        if (!enemy.alive || enemy.hitFlashTimer > 0) continue;
        const dx = enemy.x - point.x;
        const dz = enemy.z - point.z;
        if (dx * dx + dz * dz > hitRadiusSq) continue;

        enemy.health -= LIGHTNING.DAMAGE;
        enemy.hitFlashTimer = ENEMY.HIT_FLASH_DURATION;
        if (enemy.health <= 0) {
          enemy.alive = false;
          onKill(enemy.x, enemy.y, enemy.z);
        }
      }
    }
  }

  private updateLightningVisual(delta: number): void {
    if (this.lightningVisibleTimer <= 0) return;
    this.lightningVisibleTimer -= delta;
    if (this.lightningVisibleTimer <= 0) {
      for (const segment of this.lightningSegments) {
        segment.visible = false;
      }
    }
  }

  private triggerWindSlash(playerPosition: THREE.Vector3): void {
    for (let i = 0; i < WIND_SLASH.PROJECTILE_COUNT; i++) {
      const slot = this.windSlots.find((entry) => !entry.alive);
      if (!slot) continue;

      const offset =
        WIND_SLASH.PROJECTILE_COUNT === 1
          ? 0
          : (i / (WIND_SLASH.PROJECTILE_COUNT - 1) - 0.5) * WIND_SLASH.SPREAD;

      slot.alive = true;
      slot.x = playerPosition.x + offset;
      slot.y = 1.1;
      slot.z = playerPosition.z;
      slot.vx = 0;
      slot.vz = -WIND_SLASH.SPEED;
      slot.life = WIND_SLASH.LIFETIME;
    }
  }

  private updateWindSlash(
    delta: number,
    enemyManager: EnemyManager,
    onKill: (x: number, y: number, z: number) => void
  ): void {
    const hitRadiusSq = WIND_SLASH.RADIUS * WIND_SLASH.RADIUS;

    for (const slot of this.windSlots) {
      if (!slot.alive) continue;

      slot.z += slot.vz * delta;
      slot.life -= delta;
      if (slot.life <= 0 || slot.z < ARENA.BULLET_DESPAWN_Z) {
        slot.alive = false;
        continue;
      }

      for (const enemy of enemyManager.slots) {
        if (!enemy.alive || enemy.hitFlashTimer > 0) continue;
        const dx = enemy.x - slot.x;
        const dz = enemy.z - slot.z;
        if (dx * dx + dz * dz > hitRadiusSq) continue;

        enemy.health -= WIND_SLASH.DAMAGE;
        enemy.hitFlashTimer = ENEMY.HIT_FLASH_DURATION;
        if (enemy.health <= 0) {
          enemy.alive = false;
          onKill(enemy.x, enemy.y, enemy.z);
        }
      }
    }

    this.syncProjectileInstances(this.windMesh, this.windSlots, this.windDummy);
  }

  private triggerGrenade(playerPosition: THREE.Vector3): void {
    for (let i = 0; i < GRENADE.PROJECTILE_COUNT; i++) {
      const index = this.grenadeSlots.findIndex((entry) => !entry.alive);
      if (index === -1) continue;
      const slot = this.grenadeSlots[index];

      const offset =
        GRENADE.PROJECTILE_COUNT === 1
          ? 0
          : (i / (GRENADE.PROJECTILE_COUNT - 1) - 0.5) * GRENADE.SPREAD;

      slot.alive = true;
      slot.x = playerPosition.x + offset;
      slot.y = 0.9;
      slot.z = playerPosition.z;
      slot.vx = 0;
      slot.vz = -GRENADE.SPEED;
      this.grenadeFuses[index] = GRENADE.FUSE_DURATION;
    }
  }

  private updateGrenades(
    delta: number,
    enemyManager: EnemyManager,
    onKill: (x: number, y: number, z: number) => void,
    onExplode: (x: number, y: number, z: number) => void
  ): void {
    for (let i = 0; i < this.grenadeSlots.length; i++) {
      const slot = this.grenadeSlots[i];
      if (!slot.alive) continue;

      slot.z += slot.vz * delta;
      this.grenadeFuses[i] -= delta;

      if (this.grenadeFuses[i] <= 0) {
        this.explodeGrenade(slot, enemyManager, onKill);
        onExplode(slot.x, slot.y, slot.z);
        slot.alive = false;
      }
    }

    this.syncProjectileInstances(this.grenadeMesh, this.grenadeSlots, this.grenadeDummy);
  }

  private explodeGrenade(
    slot: ProjectileSlot,
    enemyManager: EnemyManager,
    onKill: (x: number, y: number, z: number) => void
  ): void {
    const radiusSq = GRENADE.EXPLOSION_RADIUS * GRENADE.EXPLOSION_RADIUS;
    for (const enemy of enemyManager.slots) {
      if (!enemy.alive || enemy.hitFlashTimer > 0) continue;
      const dx = enemy.x - slot.x;
      const dz = enemy.z - slot.z;
      if (dx * dx + dz * dz > radiusSq) continue;

      enemy.health -= GRENADE.DAMAGE;
      enemy.hitFlashTimer = ENEMY.HIT_FLASH_DURATION;
      if (enemy.health <= 0) {
        enemy.alive = false;
        onKill(enemy.x, enemy.y, enemy.z);
      }
    }
  }

  private syncProjectileInstances(
    mesh: THREE.InstancedMesh,
    slots: ProjectileSlot[],
    dummy: THREE.Object3D
  ): void {
    let renderIndex = 0;
    for (const slot of slots) {
      if (!slot.alive) continue;
      dummy.position.set(slot.x, slot.y, slot.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(renderIndex, dummy.matrix);
      renderIndex++;
    }
    mesh.count = renderIndex;
    mesh.instanceMatrix.needsUpdate = true;
  }

  public reset(): void {
    this.equipped = null;
    this.cooldownTimer = 0;
    this.lightningVisibleTimer = 0;
    for (const segment of this.lightningSegments) {
      segment.visible = false;
    }
    for (const slot of this.windSlots) {
      slot.alive = false;
    }
    this.windMesh.count = 0;
    for (const slot of this.grenadeSlots) {
      slot.alive = false;
    }
    this.grenadeMesh.count = 0;
  }
}

