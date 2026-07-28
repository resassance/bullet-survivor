import * as THREE from 'three';
import { CAMERA, CAMERA_RELOAD_FOCUS } from '../utils/constants';

export class CameraManager {
  public readonly camera: THREE.PerspectiveCamera;

  private basePosition: THREE.Vector3;
  private baseLookAt: THREE.Vector3;
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();
  private shakeMagnitude = 0;
  private shakeDuration = 0;
  private shakeElapsed = 0;
  private reloadBlend = 0;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      aspect,
      CAMERA.NEAR,
      CAMERA.FAR
    );

    this.basePosition = new THREE.Vector3(
      CAMERA.POSITION.x,
      CAMERA.POSITION.y,
      CAMERA.POSITION.z
    );
    this.baseLookAt = new THREE.Vector3(
      CAMERA.LOOK_AT.x,
      CAMERA.LOOK_AT.y,
      CAMERA.LOOK_AT.z
    );

    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(this.baseLookAt);
  }

  public updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public triggerShake(magnitude: number, duration: number): void {
    this.shakeMagnitude = magnitude;
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  public update(delta: number, playerX: number, isReloading: boolean): void {
    const blendTarget = isReloading ? 1 : 0;
    const blendSmoothing = 1 - Math.exp(-CAMERA_RELOAD_FOCUS.BLEND_SPEED * delta);
    this.reloadBlend += (blendTarget - this.reloadBlend) * blendSmoothing;

    const reloadPosition = new THREE.Vector3(
      playerX * CAMERA_RELOAD_FOCUS.X_FOLLOW,
      CAMERA_RELOAD_FOCUS.POSITION_Y,
      CAMERA_RELOAD_FOCUS.POSITION_Z
    );
    const blendedPosition = this.basePosition.clone().lerp(reloadPosition, this.reloadBlend);

    const reloadLookAt = new THREE.Vector3(playerX, CAMERA_RELOAD_FOCUS.LOOK_AT_Y, 0);
    const blendedLookAt = this.baseLookAt.clone().lerp(reloadLookAt, this.reloadBlend);

    this.updateShake(delta);

    this.camera.position.copy(blendedPosition).add(this.shakeOffset);
    this.camera.lookAt(blendedLookAt);
  }

  private updateShake(delta: number): void {
    if (this.shakeElapsed >= this.shakeDuration) {
      this.shakeOffset.set(0, 0, 0);
      return;
    }

    this.shakeElapsed += delta;
    const remainingRatio = Math.max(0, 1 - this.shakeElapsed / this.shakeDuration);
    const currentMagnitude = this.shakeMagnitude * remainingRatio;

    this.shakeOffset.set(
      (Math.random() * 2 - 1) * currentMagnitude,
      (Math.random() * 2 - 1) * currentMagnitude,
      0
    );
  }
}
