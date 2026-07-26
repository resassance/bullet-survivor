import * as THREE from 'three';
import { GATE, ARENA } from '../utils/constants';
import { GATE_MODIFIERS } from '../gameplay/modifiers';
import { createLabelTexture } from '../utils/labelTexture';
import type { BulletSlot } from './BulletManager';

interface GateSlotData {
  group: THREE.Group;
  frameMaterial: THREE.MeshBasicMaterial;
  glowMaterial: THREE.MeshBasicMaterial;
  labelMaterial: THREE.MeshBasicMaterial;
  currentTexture: THREE.CanvasTexture | null;
  x: number;
  z: number;
  alive: boolean;
  triggered: boolean;
  modifierIndex: number;
  halfWidth: number;
}

export class GateManager {
  public readonly group: THREE.Group;
  private slots: GateSlotData[] = [];
  private spawnCooldown = GATE.SPAWN_INTERVAL;

  constructor() {
    this.group = new THREE.Group();

    for (let i = 0; i < GATE.POOL_SIZE; i++) {
      this.slots.push(this.createSlot());
    }
  }

  private createSlot(): GateSlotData {
    const group = new THREE.Group();

    const frameMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      toneMapped: false,
    });

    const barGeometryH = new THREE.BoxGeometry(
      GATE.WIDTH,
      GATE.BAR_THICKNESS,
      GATE.DEPTH
    );
    const barGeometryV = new THREE.BoxGeometry(
      GATE.BAR_THICKNESS,
      GATE.HEIGHT,
      GATE.DEPTH
    );

    const topBar = new THREE.Mesh(barGeometryH, frameMaterial);
    topBar.position.y = GATE.HEIGHT;
    group.add(topBar);

    const bottomBar = new THREE.Mesh(barGeometryH, frameMaterial);
    bottomBar.position.y = 0;
    group.add(bottomBar);

    const leftBar = new THREE.Mesh(barGeometryV, frameMaterial);
    leftBar.position.set(-GATE.WIDTH / 2, GATE.HEIGHT / 2, 0);
    group.add(leftBar);

    const rightBar = new THREE.Mesh(barGeometryV, frameMaterial);
    rightBar.position.set(GATE.WIDTH / 2, GATE.HEIGHT / 2, 0);
    group.add(rightBar);

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const glowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(GATE.WIDTH, GATE.HEIGHT),
      glowMaterial
    );
    glowPlane.position.set(0, GATE.HEIGHT / 2, 0);
    group.add(glowPlane);

    const labelMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const labelPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(GATE.WIDTH * 0.95, GATE.WIDTH * 0.95 * (160 / 512)),
      labelMaterial
    );
    labelPlane.position.set(0, GATE.HEIGHT + 0.5, 0);
    group.add(labelPlane);

    group.visible = false;
    this.group.add(group);

    return {
      group,
      frameMaterial,
      glowMaterial,
      labelMaterial,
      currentTexture: null,
      x: 0,
      z: 0,
      alive: false,
      triggered: false,
      modifierIndex: 0,
      halfWidth: GATE.WIDTH / 2,
    };
  }

  public update(
    delta: number,
    playerPosition: THREE.Vector3,
    bulletSlots: readonly BulletSlot[],
    onGateTriggered: (modifierIndex: number) => void
  ): void {
    this.handleSpawning(delta);
    this.moveGates(delta);
    this.checkCollisions(playerPosition, bulletSlots, onGateTriggered);
    this.syncTransforms();
  }

  private handleSpawning(delta: number): void {
    this.spawnCooldown -= delta;
    if (this.spawnCooldown > 0) return;
    this.spawnCooldown += GATE.SPAWN_INTERVAL;

    const pairCenter = THREE.MathUtils.randFloatSpread(GATE.PAIR_CENTER_SPREAD);
    const spawnZ = ARENA.ENEMY_SPAWN_Z + THREE.MathUtils.randFloatSpread(GATE.SPAWN_Z_JITTER);

    const modifierIndices = this.pickTwoDistinctModifierIndices();

    this.spawnGate(pairCenter - GATE.PAIR_HALF_GAP, spawnZ, modifierIndices[0]);
    this.spawnGate(pairCenter + GATE.PAIR_HALF_GAP, spawnZ, modifierIndices[1]);
  }

  private pickTwoDistinctModifierIndices(): [number, number] {
    const first = Math.floor(Math.random() * GATE_MODIFIERS.length);
    let second = Math.floor(Math.random() * GATE_MODIFIERS.length);
    while (second === first) {
      second = Math.floor(Math.random() * GATE_MODIFIERS.length);
    }
    return [first, second];
  }

  private spawnGate(x: number, z: number, modifierIndex: number): void {
    const slot = this.findFreeSlot();
    if (!slot) return;

    const modifier = GATE_MODIFIERS[modifierIndex];

    slot.alive = true;
    slot.triggered = false;
    slot.x = x;
    slot.z = z;
    slot.modifierIndex = modifierIndex;

    slot.frameMaterial.color.setStyle(modifier.color);
    slot.glowMaterial.color.setStyle(modifier.color);

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

  private findFreeSlot(): GateSlotData | null {
    for (const slot of this.slots) {
      if (!slot.alive) return slot;
    }
    return null;
  }

  private moveGates(delta: number): void {
    for (const slot of this.slots) {
      if (!slot.alive) continue;
      slot.z += GATE.SPEED * delta;
      if (slot.z > GATE.DESPAWN_Z) {
        this.despawn(slot);
      }
    }
  }

  private checkCollisions(
    playerPosition: THREE.Vector3,
    bulletSlots: readonly BulletSlot[],
    onGateTriggered: (modifierIndex: number) => void
  ): void {
    for (const slot of this.slots) {
      if (!slot.alive || slot.triggered) continue;

      const withinPlayerZ = Math.abs(slot.z - playerPosition.z) <= GATE.COLLISION_Z_TOLERANCE;
      const withinPlayerX = Math.abs(slot.x - playerPosition.x) <= slot.halfWidth;

      if (withinPlayerZ && withinPlayerX) {
        this.trigger(slot, onGateTriggered);
        continue;
      }

      for (const bullet of bulletSlots) {
        if (!bullet.alive) continue;
        const withinBulletZ = Math.abs(slot.z - bullet.z) <= GATE.COLLISION_Z_TOLERANCE;
        const withinBulletX = Math.abs(slot.x - bullet.x) <= slot.halfWidth;
        if (withinBulletZ && withinBulletX) {
          this.trigger(slot, onGateTriggered);
          break;
        }
      }
    }
  }

  private trigger(
    slot: GateSlotData,
    onGateTriggered: (modifierIndex: number) => void
  ): void {
    slot.triggered = true;
    onGateTriggered(slot.modifierIndex);
    this.despawn(slot);
  }

  private despawn(slot: GateSlotData): void {
    slot.alive = false;
    slot.group.visible = false;
  }

  public reset(): void {
    for (const slot of this.slots) {
      this.despawn(slot);
    }
    this.spawnCooldown = GATE.SPAWN_INTERVAL;
  }

  private syncTransforms(): void {
    for (const slot of this.slots) {
      if (!slot.alive) continue;
      slot.group.position.set(slot.x, 0, slot.z);
    }
  }
}
