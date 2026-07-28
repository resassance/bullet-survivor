import * as THREE from 'three';
import { PLAYER } from '../utils/constants';
import { billboardYAxis } from '../utils/billboard';
import { createCharacterPoseTexture } from '../utils/characterSprite';
import type { CharacterPose } from '../utils/characterSprite';
import { loadCharacterSpriteSet } from '../utils/spriteLoader';
import { PLAYER_SPRITE_PATHS } from '../gameplay/spriteConfig';

type MovementPose = 'kneel' | 'crouch' | 'run';

export class Player {
  public readonly mesh: THREE.Mesh;

  private textures: Record<CharacterPose, THREE.Texture>;
  private material: THREE.MeshBasicMaterial;
  private movementPose: MovementPose = 'kneel';
  private displayedPose: CharacterPose = 'kneel';
  private crouchHoldTimer = 0;
  private shootTimer = 0;
  private facingSign = 1;
  private logicalX = 0;
  private recoilTimer = 0;

  constructor() {
    this.textures = {
      kneel: createCharacterPoseTexture('kneel'),
      crouch: createCharacterPoseTexture('crouch'),
      run: createCharacterPoseTexture('run'),
      reload: createCharacterPoseTexture('reload'),
      shoot: createCharacterPoseTexture('shoot'),
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

    loadCharacterSpriteSet(PLAYER_SPRITE_PATHS, (pose, texture) => {
      this.textures[pose] = texture;
      if (this.displayedPose === pose) {
        this.material.map = texture;
        this.material.needsUpdate = true;
      }
    });
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

    if (speed > PLAYER.RUN_SPEED_THRESHOLD) {
      this.movementPose = 'run';
      this.crouchHoldTimer = PLAYER.CROUCH_RETURN_DURATION;
      this.facingSign = movedDistance > 0 ? -1 : 1;
    } else if (this.movementPose === 'run') {
      this.movementPose = 'crouch';
    } else if (this.movementPose === 'crouch') {
      this.crouchHoldTimer -= delta;
      if (this.crouchHoldTimer <= 0) {
        this.movementPose = 'kneel';
      }
    }

    if (this.shootTimer > 0) {
      this.shootTimer = Math.max(0, this.shootTimer - delta);
    }

    const nextPose: CharacterPose = isReloading
      ? 'reload'
      : this.shootTimer > 0
        ? 'shoot'
        : this.movementPose;
    this.setDisplayedPose(nextPose);

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

  public triggerShot(): void {
    this.recoilTimer = PLAYER.RECOIL_DURATION;
    this.shootTimer = PLAYER.SHOOT_POSE_DURATION;
  }

  private setDisplayedPose(pose: CharacterPose): void {
    if (pose === this.displayedPose) return;
    this.displayedPose = pose;
    this.material.map = this.textures[pose];
    this.material.needsUpdate = true;
  }

  public resetPosition(): void {
    this.logicalX = 0;
    this.recoilTimer = 0;
    this.shootTimer = 0;
    this.crouchHoldTimer = 0;
    this.facingSign = 1;
    this.movementPose = 'kneel';
    this.mesh.position.set(0, PLAYER.HEIGHT / 2, PLAYER.SPAWN_Z);
    this.mesh.scale.set(1, 1, 1);
    this.setDisplayedPose('kneel');
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }
}
