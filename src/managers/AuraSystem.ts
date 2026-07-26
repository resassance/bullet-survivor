import * as THREE from 'three';
import { AURA } from '../utils/constants';
import type { EnemyManager } from './EnemyManager';

export class AuraSystem {
  public readonly mesh: THREE.Mesh;

  private active = false;
  private radius = AURA.BASE_RADIUS;
  private damage = AURA.BASE_DAMAGE;
  private tickTimer = 0;

  constructor() {
    const geometry = new THREE.RingGeometry(this.radius - 0.06, this.radius, 48);
    const material = new THREE.MeshBasicMaterial({
      color: AURA.COLOR,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.04;
    this.mesh.visible = false;
  }

  public activateOrUpgrade(): void {
    if (!this.active) {
      this.active = true;
      this.radius = AURA.BASE_RADIUS;
      this.damage = AURA.BASE_DAMAGE;
    } else {
      this.radius = Math.min(this.radius + AURA.RADIUS_PER_UPGRADE, AURA.MAX_RADIUS);
      this.damage = Math.min(this.damage + AURA.DAMAGE_PER_UPGRADE, AURA.MAX_DAMAGE);
    }

    this.rebuildRingGeometry();
    this.mesh.visible = true;
  }

  private rebuildRingGeometry(): void {
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.RingGeometry(this.radius - 0.06, this.radius, 48);
  }

  public update(
    delta: number,
    playerPosition: THREE.Vector3,
    enemyManager: EnemyManager,
    onKill: (x: number, y: number, z: number) => void
  ): void {
    this.mesh.position.x = playerPosition.x;
    this.mesh.position.z = playerPosition.z;

    if (!this.active) return;

    this.tickTimer -= delta;
    if (this.tickTimer > 0) return;
    this.tickTimer += AURA.TICK_INTERVAL;

    const radiusSq = this.radius * this.radius;

    for (const enemy of enemyManager.slots) {
      if (!enemy.alive) continue;

      const dx = enemy.x - playerPosition.x;
      const dz = enemy.z - playerPosition.z;
      if (dx * dx + dz * dz > radiusSq) continue;

      enemy.health -= this.damage;
      if (enemy.health <= 0) {
        enemy.alive = false;
        onKill(enemy.x, enemy.y, enemy.z);
      }
    }
  }

  public reset(): void {
    this.active = false;
    this.radius = AURA.BASE_RADIUS;
    this.damage = AURA.BASE_DAMAGE;
    this.tickTimer = 0;
    this.rebuildRingGeometry();
    this.mesh.visible = false;
  }
}
