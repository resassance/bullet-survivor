import * as THREE from 'three';
import { ENEMY, ARENA, ENEMY_TIER, ENEMY_SPRITE_SHEET, BOSS_ATTACK } from '../utils/constants';
import { createSilhouetteSpriteSheet } from '../utils/placeholderTexture';
import { tryLoadTexture } from '../utils/textureLoader';

export type EnemyTier = 'normal' | 'elite' | 'boss';

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
  tier: EnemyTier;
  collisionRadius: number;
  renderScale: number;
  color: THREE.Color;
  animPhase: number;
  attackTimer: number;
}

export class EnemyManager {
  public readonly mesh: THREE.InstancedMesh;
  public readonly slots: EnemySlot[] = [];

  private dummy = new THREE.Object3D();
  private elapsedTime = 0;
  private timeUniform = { value: 0 };
  private animPhaseAttribute: THREE.InstancedBufferAttribute;

  constructor() {
    const geometry = new THREE.PlaneGeometry(ENEMY.WIDTH, ENEMY.HEIGHT);
    geometry.translate(0, ENEMY.HEIGHT / 2, 0);

    this.animPhaseAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(ENEMY.POOL_SIZE),
      1
    );
    this.animPhaseAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('instanceAnimPhase', this.animPhaseAttribute);

    const texture = createSilhouetteSpriteSheet(
      { glowColor: '#ff2d55', fillColor: '#12060a' },
      ENEMY_SPRITE_SHEET.COLS,
      ENEMY_SPRITE_SHEET.ROWS
    );

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      vertexColors: true,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.timeUniform;
      shader.uniforms.uCols = { value: ENEMY_SPRITE_SHEET.COLS };
      shader.uniforms.uRows = { value: ENEMY_SPRITE_SHEET.ROWS };
      shader.uniforms.uFPS = { value: ENEMY_SPRITE_SHEET.WALK_FPS };
      shader.uniforms.uRow = { value: ENEMY_SPRITE_SHEET.WALK_ROW };

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        attribute float instanceAnimPhase;
        uniform float uTime;
        uniform float uCols;
        uniform float uRows;
        uniform float uFPS;
        uniform float uRow;
        #include <common>
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `
        #include <uv_vertex>
        {
          float frameIndex = floor((uTime + instanceAnimPhase) * uFPS);
          float col = mod(frameIndex, uCols);
          vec2 frameSize = vec2(1.0 / uCols, 1.0 / uRows);
          vec2 frameOffset = vec2(col * frameSize.x, (uRows - 1.0 - uRow) * frameSize.y);
          vUv = vUv * frameSize + frameOffset;
        }
        `
      );
    };

    tryLoadTexture('/assets/sprites/enemy/ethereal.png', (loadedTexture) => {
      material.map = loadedTexture;
      material.needsUpdate = true;
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
        tier: 'normal',
        collisionRadius: ENEMY.COLLISION_RADIUS,
        renderScale: 1,
        color: new THREE.Color(0xffffff),
        animPhase: 0,
        attackTimer: 0,
      });
    }
  }

  public update(
    delta: number,
    camera: THREE.Camera,
    onPoisonKill: (x: number, y: number, z: number, tier: EnemyTier) => void,
    onBreach: (tier: EnemyTier) => void,
    onBossAttackReady: (x: number, z: number) => void
  ): void {
    this.elapsedTime += delta;
    this.timeUniform.value = this.elapsedTime;
    this.moveEnemies(delta, onBreach);
    this.updateBossAttacks(delta, onBossAttackReady);
    this.processPoison(delta, onPoisonKill);
    this.decayHitFlash(delta);
    this.syncInstances(camera);
  }

  private updateBossAttacks(
    delta: number,
    onBossAttackReady: (x: number, z: number) => void
  ): void {
    for (const slot of this.slots) {
      if (!slot.alive || slot.tier !== 'boss') continue;

      slot.attackTimer -= delta;
      if (slot.attackTimer <= 0) {
        slot.attackTimer = BOSS_ATTACK.COOLDOWN;
        onBossAttackReady(slot.x, slot.z);
      }
    }
  }

  public spawnBatch(count: number, tiers?: readonly EnemyTier[]): void {
    for (let i = 0; i < count; i++) {
      this.spawnEnemy(tiers?.[i] ?? 'normal');
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
    onPoisonKill: (x: number, y: number, z: number, tier: EnemyTier) => void
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
        onPoisonKill(slot.x, slot.y, slot.z, slot.tier);
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

  private spawnEnemy(tier: EnemyTier): void {
    const slot = this.findFreeSlot();
    if (!slot) return;

    const baseHealth = Math.min(
      ENEMY.HEALTH_BASE + ENEMY.HEALTH_GROWTH_PER_SECOND * this.elapsedTime,
      ENEMY.HEALTH_CAP
    );

    slot.alive = true;
    slot.tier = tier;

    if (tier === 'boss') {
      slot.health = baseHealth * ENEMY_TIER.BOSS_HEALTH_MULTIPLIER;
      slot.renderScale = ENEMY_TIER.BOSS_SCALE;
      slot.collisionRadius = ENEMY.COLLISION_RADIUS * ENEMY_TIER.BOSS_SCALE;
      slot.color.setHex(ENEMY_TIER.BOSS_COLOR);
    } else if (tier === 'elite') {
      slot.health = baseHealth * ENEMY_TIER.ELITE_HEALTH_MULTIPLIER;
      slot.renderScale = ENEMY_TIER.ELITE_SCALE;
      slot.collisionRadius = ENEMY.COLLISION_RADIUS * ENEMY_TIER.ELITE_SCALE;
      slot.color.setHex(ENEMY_TIER.ELITE_COLOR);
    } else {
      slot.health = baseHealth;
      slot.renderScale = 1;
      slot.collisionRadius = ENEMY.COLLISION_RADIUS;
      slot.color.setHex(0xffffff);
    }

    slot.baseX = THREE.MathUtils.randFloatSpread(ENEMY.SPAWN_X_SPREAD);
    slot.x = slot.baseX;
    slot.y = 0;
    slot.z = ARENA.ENEMY_SPAWN_Z + THREE.MathUtils.randFloatSpread(ENEMY.SPAWN_Z_JITTER);

    let speedMultiplier = 1;
    if (tier === 'boss') speedMultiplier = ENEMY_TIER.BOSS_SPEED_MULTIPLIER;
    else if (tier === 'elite') speedMultiplier = ENEMY_TIER.ELITE_SPEED_MULTIPLIER;

    slot.speed =
      ENEMY.SPEED * speedMultiplier * (1 + THREE.MathUtils.randFloatSpread(ENEMY.SPEED_VARIANCE));
    slot.wobblePhase = Math.random() * Math.PI * 2;
    slot.wobbleFrequency = THREE.MathUtils.randFloat(
      ENEMY.WOBBLE_FREQUENCY_MIN,
      ENEMY.WOBBLE_FREQUENCY_MAX
    );
    slot.wobbleAmplitude = THREE.MathUtils.randFloat(
      ENEMY.WOBBLE_AMPLITUDE_MIN,
      ENEMY.WOBBLE_AMPLITUDE_MAX
    );
    slot.animPhase = Math.random() * ENEMY_SPRITE_SHEET.PHASE_RANDOM_RANGE;
    slot.attackTimer = tier === 'boss' ? BOSS_ATTACK.INITIAL_DELAY : 0;

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

  private moveEnemies(delta: number, onBreach: (tier: EnemyTier) => void): void {
    for (const slot of this.slots) {
      if (!slot.alive) continue;

      slot.z += slot.speed * delta;

      const wobble =
        Math.sin(this.elapsedTime * slot.wobbleFrequency + slot.wobblePhase) *
        slot.wobbleAmplitude;
      slot.x = slot.baseX + wobble;

      if (slot.z > ENEMY.BREACH_Z) {
        const tier = slot.tier;
        slot.alive = false;
        onBreach(tier);
      }
    }
  }

  public clearAllAlive(): void {
    for (const slot of this.slots) {
      slot.alive = false;
    }
  }

  public damageInRadius(
    x: number,
    z: number,
    radius: number,
    onKilled: (x: number, y: number, z: number, tier: EnemyTier) => void
  ): void {
    const radiusSq = radius * radius;
    for (const slot of this.slots) {
      if (!slot.alive) continue;
      const dx = slot.x - x;
      const dz = slot.z - z;
      if (dx * dx + dz * dz <= radiusSq) {
        slot.alive = false;
        onKilled(slot.x, slot.y, slot.z, slot.tier);
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
      const scale = slot.renderScale * (1 + flashRatio * ENEMY.HIT_FLASH_SCALE_BOOST);
      this.dummy.scale.setScalar(scale);

      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(renderIndex, this.dummy.matrix);
      this.mesh.setColorAt(renderIndex, slot.color);
      this.animPhaseAttribute.array[renderIndex] = slot.animPhase;
      renderIndex++;
    }
    this.mesh.count = renderIndex;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.animPhaseAttribute.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }
}
