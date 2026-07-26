import * as THREE from 'three';
import { GEM } from '../utils/constants';

interface GemSlot {
  x: number;
  y: number;
  z: number;
  alive: boolean;
  bobPhase: number;
}

export class GemManager {
  public readonly mesh: THREE.InstancedMesh;
  private slots: GemSlot[] = [];
  private dummy = new THREE.Object3D();
  private elapsedTime = 0;

  constructor() {
    const geometry = new THREE.OctahedronGeometry(GEM.RADIUS);
    const material = new THREE.MeshBasicMaterial({
      color: GEM.COLOR,
      toneMapped: false,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, GEM.POOL_SIZE);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;

    for (let i = 0; i < GEM.POOL_SIZE; i++) {
      this.slots.push({ x: 0, y: 0, z: 0, alive: false, bobPhase: 0 });
    }
  }

  public spawn(x: number, z: number): void {
    const slot = this.findFreeSlot();
    if (!slot) return;

    slot.alive = true;
    slot.x = x;
    slot.z = z;
    slot.bobPhase = Math.random() * Math.PI * 2;
  }

  private findFreeSlot(): GemSlot | null {
    for (const slot of this.slots) {
      if (!slot.alive) return slot;
    }
    return null;
  }

  public update(
    delta: number,
    playerPosition: THREE.Vector3,
    onCollect: (value: number) => void
  ): void {
    this.elapsedTime += delta;

    const pickupRadiusSq = GEM.PICKUP_RADIUS * GEM.PICKUP_RADIUS;
    const smoothing = 1 - Math.exp(-GEM.MAGNET_SMOOTHING * delta);

    for (const slot of this.slots) {
      if (!slot.alive) continue;

      const dx = playerPosition.x - slot.x;
      const dz = playerPosition.z - slot.z;
      const distSq = dx * dx + dz * dz;

      if (distSq <= pickupRadiusSq) {
        slot.alive = false;
        onCollect(GEM.VALUE);
        continue;
      }

      slot.x += dx * smoothing;
      slot.z += dz * smoothing;
    }

    this.syncInstances();
  }

  public reset(): void {
    for (const slot of this.slots) {
      slot.alive = false;
    }
    this.mesh.count = 0;
    this.elapsedTime = 0;
  }

  private syncInstances(): void {
    let renderIndex = 0;
    for (const slot of this.slots) {
      if (!slot.alive) continue;

      const bobY =
        GEM.BASE_HEIGHT +
        Math.sin(this.elapsedTime * GEM.BOB_FREQUENCY + slot.bobPhase) * GEM.BOB_AMPLITUDE;

      this.dummy.position.set(slot.x, bobY, slot.z);
      this.dummy.rotation.set(0, this.elapsedTime * 1.5 + slot.bobPhase, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(renderIndex, this.dummy.matrix);
      renderIndex++;
    }
    this.mesh.count = renderIndex;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
