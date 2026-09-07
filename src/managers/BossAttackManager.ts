import * as THREE from 'three';
import { ARENA, BOSS_ATTACK } from '../utils/constants';

const POOL_SIZE = 6;

interface TelegraphSlot {
  active: boolean;
  x: number;
  timer: number;
  mesh: THREE.Mesh;
}

export class BossAttackManager {
  public readonly group: THREE.Group;
  private slots: TelegraphSlot[] = [];

  constructor() {
    this.group = new THREE.Group();
    const geometry = new THREE.PlaneGeometry(BOSS_ATTACK.ZONE_WIDTH, ARENA.DEPTH);

    for (let i = 0; i < POOL_SIZE; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xff2d2d,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.02;
      mesh.position.z = -ARENA.DEPTH / 2 + 10;
      mesh.visible = false;
      this.group.add(mesh);
      this.slots.push({ active: false, x: 0, timer: 0, mesh });
    }
  }

  public trigger(x: number): void {
    const slot = this.slots.find((candidate) => !candidate.active);
    if (!slot) return;

    slot.active = true;
    slot.x = x;
    slot.timer = BOSS_ATTACK.TELEGRAPH_DURATION;
    slot.mesh.position.x = x;
    slot.mesh.visible = true;
    (slot.mesh.material as THREE.MeshBasicMaterial).opacity = 0.12;
  }

  public update(delta: number, onFire: (x: number) => void): void {
    for (const slot of this.slots) {
      if (!slot.active) continue;

      slot.timer -= delta;
      const ratio = 1 - Math.max(0, slot.timer / BOSS_ATTACK.TELEGRAPH_DURATION);
      (slot.mesh.material as THREE.MeshBasicMaterial).opacity = 0.12 + ratio * 0.55;

      if (slot.timer <= 0) {
        slot.active = false;
        slot.mesh.visible = false;
        onFire(slot.x);
      }
    }
  }

  public reset(): void {
    for (const slot of this.slots) {
      slot.active = false;
      slot.mesh.visible = false;
    }
  }
}
