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
  homingStrength: number;
  laneOffsetX: number;
  wobblePhase: number;
  wobbleFrequency: number;
  wobbleAmplitude: number;
}

export class EnemyManager {
  public readonly mesh: THREE.InstancedMesh;
  public readonly slots: EnemySlot[] = [];

  private dummy = new THREE.Object3D();
  private spawnCooldown = ENEMY.SPAWN_INTERVAL;
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
        homingStrength: ENEMY.HOMING_STRENGTH,
        laneOffsetX: 0,
        wobblePhase: 0,
        wobbleFrequency: 1,
        wobbleAmplitude: 0,
      });
    }
  }

  public update(
    delta: number,
    playerPosition: THREE.Vector3,
    camera: THREE.Camera
  ): void {
    this.elapsedTime += delta;
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
    if (!slot) return;

    slot.alive = true;
    slot.health = ENEMY.HEALTH;
    slot.x = THREE.MathUtils.randFloatSpread(ENEMY.SPAWN_X_SPREAD);
    slot.y = 0;
    slot.z = ARENA.ENEMY_SPAWN_Z + THREE.MathUtils.randFloatSpread(ENEMY.SPAWN_Z_JITTER);

    slot.speed = ENEMY.SPEED * (1 + THREE.MathUtils.randFloatSpread(ENEMY.SPEED_VARIANCE));
    slot.homingStrength =
      ENEMY.HOMING_STRENGTH * (1 + THREE.MathUtils.randFloatSpread(ENEMY.HOMING_VARIANCE));
    slot.laneOffsetX = THREE.MathUtils.randFloatSpread(ENEMY.LANE_OFFSET_SPREAD);
    slot.wobblePhase = Math.random() * Math.PI * 2;
    slot.wobbleFrequency = THREE.MathUtils.randFloat(
      ENEMY.WOBBLE_FREQUENCY_MIN,
      ENEMY.WOBBLE_FREQUENCY_MAX
    );
    slot.wobbleAmplitude = THREE.MathUtils.randFloat(
      ENEMY.WOBBLE_AMPLITUDE_MIN,
      ENEMY.WOBBLE_AMPLITUDE_MAX
    );
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

      slot.z += slot.speed * delta;

      const wobble =
        Math.sin(this.elapsedTime * slot.wobbleFrequency + slot.wobblePhase) *
        slot.wobbleAmplitude;
      const targetX = playerPosition.x + slot.laneOffsetX + wobble;

      const homingFactor = 1 - Math.exp(-slot.homingStrength * delta);
      slot.x += (targetX - slot.x) * homingFactor;

      if (slot.z > ENEMY.DESPAWN_Z) {
        slot.alive = false;
      }
    }
  }

  public reset(): void {
    for (const slot of this.slots) {
      slot.alive = false;
    }
    this.mesh.count = 0;
    this.spawnCooldown = ENEMY.SPAWN_INTERVAL;
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
      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(renderIndex, this.dummy.matrix);
      renderIndex++;
    }
    this.mesh.count = renderIndex;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
