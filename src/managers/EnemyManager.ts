import * as THREE from 'three';
import { ENEMY, ARENA } from '../utils/constants';
import { createSilhouettePlaceholder } from '../utils/placeholderTexture';

export interface EnemySlot {
  x: number;
  y: number;
  z: number;
  alive: boolean;
  health: number;
  speed: number;
  baseX: number;
  wobblePhase: number;
  wobbleFrequency: number;
  wobbleAmplitude: number;
  poisonDamagePerTick: number;
  poisonTicksRemaining: number;
  poisonTickTimer: number;
  poisonTickInterval: number;
  hitFlashTimer: number;
}

export class EnemyManager {
  public readonly mesh: THREE.InstancedMesh;
  public readonly slots: EnemySlot[] = [];

  private dummy = new THREE.Object3D();
  private elapsedTime = 0;

  constructor() {
    const geometry = new THREE.PlaneGeometry(ENEMY.WIDTH, ENEMY.HEIGHT);
    geometry.translate(0, ENEMY.HEIGHT / 2, 0);

    const texture = createSilhouettePlaceholder({
      glowColor: '#ff2d55',
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
    this.mesh.frustumCulled = false;

    for (let i = 0; i < ENEMY.POOL_SIZE; i++) {
      this.slots.push({
        x: 0,
        y: 0,
        z: 0,
        alive: false,
        health: 0,
        speed: ENEMY.SPEED,
        baseX: 0,
        wobblePhase: 0,
        wobbleFrequency: 1,
        wobbleAmplitude: 0,
        poisonDamagePerTick: 0,
        poisonTicksRemaining: 0,
        poisonTickTimer: 0,
        poisonTickInterval: 0,
        hitFlashTimer: 0,
      });
    }
  }

  public update(
    delta: number,
    camera: THREE.Camera,
    onPoisonKill: (x: number, y: number, z: number) => void,
    onBreach: () => void
  ): void {
    this.elapsedTime += delta;
    this.moveEnemies(delta, onBreach);
    this.processPoison(delta, onPoisonKill);
    this.decayHitFlash(delta);
    this.syncInstances(camera);
  }

  public spawnBatch(count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawnEnemy();
    }
  }

  public get aliveCount(): number {
    let count = 0;
    for (const slot of this.slots) {
      if (slot.alive) count += 1;
    }
    return count;
  }

  public applyPoison(slot: EnemySlot, damagePerTick: number, ticks: number, tickInterval: number): void {
    slot.poisonDamagePerTick = damagePerTick;
    slot.poisonTicksRemaining = ticks;
    slot.poisonTickTimer = tickInterval;
    slot.poisonTickInterval = tickInterval;
  }

  private processPoison(
    delta: number,
    onPoisonKill: (x: number, y: number, z: number) => void
  ): void {
    for (const slot of this.slots) {
      if (!slot.alive || slot.poisonTicksRemaining <= 0) continue;

      slot.poisonTickTimer -= delta;
      if (slot.poisonTickTimer > 0) continue;

      slot.poisonTickTimer += slot.poisonTickInterval;
      slot.health -= slot.poisonDamagePerTick;
      slot.poisonTicksRemaining -= 1;

      if (slot.health <= 0) {
        slot.alive = false;
        onPoisonKill(slot.x, slot.y, slot.z);
      }
    }
  }

  private decayHitFlash(delta: number): void {
    for (const slot of this.slots) {
      if (slot.hitFlashTimer > 0) {
        slot.hitFlashTimer = Math.max(0, slot.hitFlashTimer - delta);
      }
    }
  }

  private spawnEnemy(): void {
    const slot = this.findFreeSlot();
    if (!slot) return;

    slot.alive = true;
    slot.health = Math.min(
      ENEMY.HEALTH_BASE + ENEMY.HEALTH_GROWTH_PER_SECOND * this.elapsedTime,
      ENEMY.HEALTH_CAP
    );
    slot.baseX = THREE.MathUtils.randFloatSpread(ENEMY.SPAWN_X_SPREAD);
    slot.x = slot.baseX;
    slot.y = 0;
    slot.z = ARENA.ENEMY_SPAWN_Z + THREE.MathUtils.randFloatSpread(ENEMY.SPAWN_Z_JITTER);

    slot.speed = ENEMY.SPEED * (1 + THREE.MathUtils.randFloatSpread(ENEMY.SPEED_VARIANCE));
    slot.wobblePhase = Math.random() * Math.PI * 2;
    slot.wobbleFrequency = THREE.MathUtils.randFloat(
      ENEMY.WOBBLE_FREQUENCY_MIN,
      ENEMY.WOBBLE_FREQUENCY_MAX
    );
    slot.wobbleAmplitude = THREE.MathUtils.randFloat(
      ENEMY.WOBBLE_AMPLITUDE_MIN,
      ENEMY.WOBBLE_AMPLITUDE_MAX
    );

    slot.poisonDamagePerTick = 0;
    slot.poisonTicksRemaining = 0;
    slot.poisonTickTimer = 0;
    slot.poisonTickInterval = 0;
    slot.hitFlashTimer = 0;
  }

  private findFreeSlot(): EnemySlot | null {
    for (const slot of this.slots) {
      if (!slot.alive) return slot;
    }
    return null;
  }

  private moveEnemies(delta: number, onBreach: () => void): void {
    for (const slot of this.slots) {
      if (!slot.alive) continue;

      slot.z += slot.speed * delta;

      const wobble =
        Math.sin(this.elapsedTime * slot.wobbleFrequency + slot.wobblePhase) *
        slot.wobbleAmplitude;
      slot.x = slot.baseX + wobble;

      if (slot.z > ENEMY.BREACH_Z) {
        slot.alive = false;
        onBreach();
      }
    }
  }

  public reset(): void {
    for (const slot of this.slots) {
      slot.alive = false;
      slot.poisonTicksRemaining = 0;
      slot.hitFlashTimer = 0;
    }
    this.mesh.count = 0;
    this.elapsedTime = 0;
  }

  private syncInstances(camera: THREE.Camera): void {
    let renderIndex = 0;
    for (const slot of this.slots) {
      if (!slot.alive) continue;

      this.dummy.position.set(slot.x, slot.y, slot.z);

      const dx = camera.position.x - slot.x;
      const dz = camera.position.z - slot.z;
      this.dummy.rotation.set(0, Math.atan2(dx, dz), 0);

      const flashRatio = slot.hitFlashTimer / ENEMY.HIT_FLASH_DURATION;
      const scale = 1 + flashRatio * ENEMY.HIT_FLASH_SCALE_BOOST;
      this.dummy.scale.setScalar(scale);

      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(renderIndex, this.dummy.matrix);
      renderIndex++;
    }
    this.mesh.count = renderIndex;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
