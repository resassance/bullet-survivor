import * as THREE from 'three';
import { PLAYER } from '../utils/constants';
import { billboardYAxis } from '../utils/billboard';
import { createCharacterPoseTexture } from '../utils/characterSprite';
import type { CharacterPose } from '../utils/characterSprite';

export class Player {
  public readonly mesh: THREE.Mesh;

  private textures: Record<CharacterPose, THREE.CanvasTexture>;
  private material: THREE.MeshBasicMaterial;
  private currentPose: CharacterPose = 'kneel';
  private poseElapsed = 0;
  private facingSign = 1;
  private logicalX = 0;
  private recoilTimer = 0;

  constructor() {
    this.textures = {
      kneel: createCharacterPoseTexture('kneel'),
      crouch: createCharacterPoseTexture('crouch'),
      run: createCharacterPoseTexture('run'),
      reload: createCharacterPoseTexture('reload'),
    };

    const geometry = new THREE.PlaneGeometry(PLAYER.WIDTH, PLAYER.HEIGHT);

    this.material = new THREE.MeshBasicMaterial({
      map: this.textures.kneel,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(0, PLAYER.HEIGHT / 2, PLAYER.SPAWN_Z);
  }

  public update(
    delta: number,
    targetX: number,
    camera: THREE.Camera,
    isReloading: boolean
  ): void {
    const previousLogicalX = this.logicalX;

    if (!isReloading) {
      const smoothing = 1 - Math.exp(-PLAYER.MOVE_SMOOTHING * delta);
      this.logicalX += (targetX - this.logicalX) * smoothing;
    }

    const movedDistance = this.logicalX - previousLogicalX;
    const speed = Math.abs(movedDistance) / Math.max(delta, 0.0001);

    this.poseElapsed += delta;

    if (isReloading) {
      this.setPose('reload');
    } else if (speed > PLAYER.RUN_SPEED_THRESHOLD) {
      this.setPose('run');
      this.facingSign = movedDistance > 0 ? -1 : 1;
    } else if (this.currentPose === 'run') {
      this.setPose('crouch');
    } else if (this.currentPose === 'crouch' && this.poseElapsed < PLAYER.CROUCH_RETURN_DURATION) {
    } else {
      this.setPose('kneel');
    }

    if (this.recoilTimer > 0) {
      this.recoilTimer = Math.max(0, this.recoilTimer - delta);
    }
    const recoilRatio = this.recoilTimer / PLAYER.RECOIL_DURATION;
    const jitterX = (Math.random() * 2 - 1) * PLAYER.RECOIL_JITTER_AMOUNT * recoilRatio;
    const scalePunch = 1 + PLAYER.RECOIL_SCALE_PUNCH * recoilRatio;

    this.mesh.position.x = this.logicalX + jitterX;
    this.mesh.scale.set(this.facingSign * scalePunch, scalePunch, 1);

    billboardYAxis(this.mesh, camera);
  }

  public triggerRecoil(): void {
    this.recoilTimer = PLAYER.RECOIL_DURATION;
  }

  private setPose(pose: CharacterPose): void {
    if (pose === this.currentPose) return;
    this.currentPose = pose;
    this.poseElapsed = 0;
    this.material.map = this.textures[pose];
    this.material.needsUpdate = true;
  }

  public resetPosition(): void {
    this.logicalX = 0;
    this.recoilTimer = 0;
    this.facingSign = 1;
    this.mesh.position.set(0, PLAYER.HEIGHT / 2, PLAYER.SPAWN_Z);
    this.mesh.scale.set(1, 1, 1);
    this.setPose('kneel');
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }
}
