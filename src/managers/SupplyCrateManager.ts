import * as THREE from 'three';
import { CRATE, ARENA } from '../utils/constants';
import { CRATE_MODIFIERS } from '../gameplay/crateModifiers';
import { createLabelTexture } from '../utils/labelTexture';
import type { BulletSlot } from './BulletManager';

interface CrateSlotData {
  group: THREE.Group;
  trimMaterial: THREE.MeshStandardMaterial;
  labelMaterial: THREE.MeshBasicMaterial;
  currentTexture: THREE.CanvasTexture | null;
  x: number;
  z: number;
  alive: boolean;
  triggered: boolean;
  modifierIndex: number;
  halfWidth: number;
}

export class SupplyCrateManager {
  public readonly group: THREE.Group;
  private slots: CrateSlotData[] = [];
  private spawnCooldown = CRATE.SPAWN_INTERVAL;

  constructor() {
    this.group = new THREE.Group();

    for (let i = 0; i < CRATE.POOL_SIZE; i++) {
      this.slots.push(this.createSlot());
    }
  }

  private createSlot(): CrateSlotData {
    const group = new THREE.Group();

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f2a1c,
      roughness: 0.9,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(CRATE.WIDTH, CRATE.HEIGHT, CRATE.DEPTH),
      bodyMaterial
    );
    body.position.y = CRATE.HEIGHT / 2;
    group.add(body);

    const strapMaterial = new THREE.MeshStandardMaterial({
      color: 0x161310,
      roughness: 0.8,
      metalness: 0.25,
    });
    const strapGeometry = new THREE.BoxGeometry(
      CRATE.WIDTH + 0.03,
      CRATE.STRAP_THICKNESS,
      CRATE.DEPTH + 0.03
    );
    const strapFront = new THREE.Mesh(strapGeometry, strapMaterial);
    strapFront.position.set(0, CRATE.HEIGHT * 0.7, 0);
    group.add(strapFront);

    const strapBack = new THREE.Mesh(strapGeometry, strapMaterial);
    strapBack.position.set(0, CRATE.HEIGHT * 0.3, 0);
    group.add(strapBack);

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.6,
      roughness: 0.4,
      metalness: 0.1,
      toneMapped: false,
    });
    const trimGeometry = new THREE.BoxGeometry(
      CRATE.WIDTH + 0.05,
      CRATE.TRIM_THICKNESS,
      CRATE.TRIM_THICKNESS
    );
    const trimTop = new THREE.Mesh(trimGeometry, trimMaterial);
    trimTop.position.set(0, CRATE.HEIGHT, CRATE.DEPTH / 2);
    group.add(trimTop);

    const trimBottom = new THREE.Mesh(trimGeometry, trimMaterial);
    trimBottom.position.set(0, 0, CRATE.DEPTH / 2);
    group.add(trimBottom);

    const labelMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const labelPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(CRATE.WIDTH * 0.85, CRATE.WIDTH * 0.85 * (160 / 512)),
      labelMaterial
    );
    labelPlane.rotation.x = -Math.PI / 2;
    labelPlane.position.set(0, CRATE.HEIGHT + 0.01, 0);
    group.add(labelPlane);

    group.visible = false;
    this.group.add(group);

    return {
      group,
      trimMaterial,
      labelMaterial,
      currentTexture: null,
      x: 0,
      z: 0,
      alive: false,
      triggered: false,
      modifierIndex: 0,
      halfWidth: CRATE.WIDTH / 2,
    };
  }

  public update(
    delta: number,
    playerPosition: THREE.Vector3,
    bulletSlots: readonly BulletSlot[],
    onCrateTriggered: (modifierIndex: number) => void
  ): void {
    this.handleSpawning(delta);
    this.moveCrates(delta);
    this.checkCollisions(playerPosition, bulletSlots, onCrateTriggered);
    this.syncTransforms();
  }

  private handleSpawning(delta: number): void {
    this.spawnCooldown -= delta;
    if (this.spawnCooldown > 0) return;
    this.spawnCooldown += CRATE.SPAWN_INTERVAL;

    const pairCenter = THREE.MathUtils.randFloatSpread(CRATE.PAIR_CENTER_SPREAD);
    const spawnZ = ARENA.ENEMY_SPAWN_Z + THREE.MathUtils.randFloatSpread(CRATE.SPAWN_Z_JITTER);

    const modifierIndices = this.pickTwoDistinctModifierIndices();

    this.spawnCrate(pairCenter - CRATE.PAIR_HALF_GAP, spawnZ, modifierIndices[0]);
    this.spawnCrate(pairCenter + CRATE.PAIR_HALF_GAP, spawnZ, modifierIndices[1]);
  }

  private pickTwoDistinctModifierIndices(): [number, number] {
    const first = Math.floor(Math.random() * CRATE_MODIFIERS.length);
    let second = Math.floor(Math.random() * CRATE_MODIFIERS.length);
    while (second === first) {
      second = Math.floor(Math.random() * CRATE_MODIFIERS.length);
    }
    return [first, second];
  }

  private spawnCrate(x: number, z: number, modifierIndex: number): void {
    const slot = this.findFreeSlot();
    if (!slot) return;

    const modifier = CRATE_MODIFIERS[modifierIndex];

    slot.alive = true;
    slot.triggered = false;
    slot.x = x;
    slot.z = z;
    slot.modifierIndex = modifierIndex;

    slot.trimMaterial.color.setStyle(modifier.color);
    slot.trimMaterial.emissive.setStyle(modifier.color);

    if (slot.currentTexture) {
      slot.currentTexture.dispose();
    }
    const texture = createLabelTexture(modifier.label, modifier.color);
    slot.labelMaterial.map = texture;
    slot.labelMaterial.needsUpdate = true;
    slot.currentTexture = texture;

    slot.group.visible = true;
    slot.group.position.set(x, 0, z);
  }

  private findFreeSlot(): CrateSlotData | null {
    for (const slot of this.slots) {
      if (!slot.alive) return slot;
    }
    return null;
  }

  private moveCrates(delta: number): void {
    for (const slot of this.slots) {
      if (!slot.alive) continue;
      slot.z += CRATE.SPEED * delta;
      if (slot.z > CRATE.DESPAWN_Z) {
        this.despawn(slot);
      }
    }
  }

  private checkCollisions(
    playerPosition: THREE.Vector3,
    bulletSlots: readonly BulletSlot[],
    onCrateTriggered: (modifierIndex: number) => void
  ): void {
    for (const slot of this.slots) {
      if (!slot.alive || slot.triggered) continue;

      const withinPlayerZ = Math.abs(slot.z - playerPosition.z) <= CRATE.COLLISION_Z_TOLERANCE;
      const withinPlayerX = Math.abs(slot.x - playerPosition.x) <= slot.halfWidth;

      if (withinPlayerZ && withinPlayerX) {
        this.trigger(slot, onCrateTriggered);
        continue;
      }

      for (const bullet of bulletSlots) {
        if (!bullet.alive) continue;
        const withinBulletZ = Math.abs(slot.z - bullet.z) <= CRATE.COLLISION_Z_TOLERANCE;
        const withinBulletX = Math.abs(slot.x - bullet.x) <= slot.halfWidth;
        if (withinBulletZ && withinBulletX) {
          this.trigger(slot, onCrateTriggered);
          break;
        }
      }
    }
  }

  private trigger(
    slot: CrateSlotData,
    onCrateTriggered: (modifierIndex: number) => void
  ): void {
    slot.triggered = true;
    onCrateTriggered(slot.modifierIndex);
    this.despawn(slot);
  }

  private despawn(slot: CrateSlotData): void {
    slot.alive = false;
    slot.group.visible = false;
  }

  public reset(): void {
    for (const slot of this.slots) {
      this.despawn(slot);
    }
    this.spawnCooldown = CRATE.SPAWN_INTERVAL;
  }

  private syncTransforms(): void {
    for (const slot of this.slots) {
      if (!slot.alive) continue;
      slot.group.position.set(slot.x, 0, slot.z);
    }
  }
}
