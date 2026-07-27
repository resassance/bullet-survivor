import * as THREE from 'three';
import { PARTICLE } from '../utils/constants';

interface ParticleSlot {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  alive: boolean;
}

export class ParticleManager {
  public readonly mesh: THREE.InstancedMesh;
  private slots: ParticleSlot[] = [];
  private dummy = new THREE.Object3D();

  constructor() {
    const geometry = new THREE.IcosahedronGeometry(PARTICLE.RADIUS, 0);
    const material = new THREE.MeshBasicMaterial({
      color: PARTICLE.COLOR,
      toneMapped: false,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, PARTICLE.POOL_SIZE);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;

    for (let i = 0; i < PARTICLE.POOL_SIZE; i++) {
      this.slots.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, alive: false });
    }
  }

  public burst(x: number, y: number, z: number): void {
    for (let i = 0; i < PARTICLE.BURST_COUNT; i++) {
      const slot = this.findFreeSlot();
      if (!slot) return;

      const angle = Math.random() * Math.PI * 2;
      const speed = THREE.MathUtils.randFloat(PARTICLE.SPEED_MIN, PARTICLE.SPEED_MAX);
      const upward = THREE.MathUtils.randFloat(1, 3);

      slot.alive = true;
      slot.x = x;
      slot.y = y + 0.3;
      slot.z = z;
      slot.vx = Math.cos(angle) * speed;
      slot.vy = upward;
      slot.vz = Math.sin(angle) * speed;
      slot.life = PARTICLE.LIFETIME;
    }
  }

  private findFreeSlot(): ParticleSlot | null {
    for (const slot of this.slots) {
      if (!slot.alive) return slot;
    }
    return null;
  }

  public update(delta: number): void {
    for (const slot of this.slots) {
      if (!slot.alive) continue;

      slot.life -= delta;
      if (slot.life <= 0) {
        slot.alive = false;
        continue;
      }

      slot.vy -= 9 * delta;
      slot.x += slot.vx * delta;
      slot.y += slot.vy * delta;
      slot.z += slot.vz * delta;
    }

    this.syncInstances();
  }

  public reset(): void {
    for (const slot of this.slots) {
      slot.alive = false;
    }
    this.mesh.count = 0;
  }

  private syncInstances(): void {
    let renderIndex = 0;
    for (const slot of this.slots) {
      if (!slot.alive) continue;

      const lifeRatio = Math.max(0, slot.life / PARTICLE.LIFETIME);
      this.dummy.position.set(slot.x, slot.y, slot.z);
      this.dummy.scale.setScalar(lifeRatio);
      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(renderIndex, this.dummy.matrix);
      renderIndex++;
    }
    this.mesh.count = renderIndex;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
