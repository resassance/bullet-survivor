import * as THREE from 'three';
import { CAMERA, CAMERA_RELOAD_FOCUS, CAMP_CAMERA } from '../utils/constants';

interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

export class CameraManager {
  public readonly camera: THREE.PerspectiveCamera;

  private basePosition: THREE.Vector3;
  private baseLookAt: THREE.Vector3;
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();
  private shakeMagnitude = 0;
  private shakeDuration = 0;
  private shakeElapsed = 0;
  private reloadBlend = 0;

  private campActive = false;
  private campBlend = 0;
  private campTargetPosition: THREE.Vector3;
  private campTargetLookAt: THREE.Vector3;
  private campCurrentPosition: THREE.Vector3;
  private campCurrentLookAt: THREE.Vector3;
  private campElapsed = 0;

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

    this.campTargetPosition = new THREE.Vector3(
      CAMP_CAMERA.OVERVIEW_POSITION.x,
      CAMP_CAMERA.OVERVIEW_POSITION.y,
      CAMP_CAMERA.OVERVIEW_POSITION.z
    );
    this.campTargetLookAt = new THREE.Vector3(
      CAMP_CAMERA.OVERVIEW_LOOK_AT.x,
      CAMP_CAMERA.OVERVIEW_LOOK_AT.y,
      CAMP_CAMERA.OVERVIEW_LOOK_AT.z
    );
    this.campCurrentPosition = this.campTargetPosition.clone();
    this.campCurrentLookAt = this.campTargetLookAt.clone();

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

  /** Enables/disables blending toward the camp camera target. */
  public setCampActive(active: boolean): void {
    this.campActive = active;
  }

  /** Sets the camera position/lookAt the camp blend dollies toward (overview or a station). */
  public setCampTarget(position: Vec3Like, lookAt: Vec3Like): void {
    this.campTargetPosition.set(position.x, position.y, position.z);
    this.campTargetLookAt.set(lookAt.x, lookAt.y, lookAt.z);
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

    const campBlendTarget = this.campActive ? 1 : 0;
    const campSmoothing = 1 - Math.exp(-CAMP_CAMERA.BLEND_SPEED * delta);
    this.campBlend += (campBlendTarget - this.campBlend) * campSmoothing;

    // Always ease the camp "current" position toward its target, independent of
    // campBlend activation, so switching stations while already in camp dollies
    // smoothly instead of snapping (campBlend alone only smooths entering/leaving camp).
    this.campCurrentPosition.lerp(this.campTargetPosition, campSmoothing);
    this.campCurrentLookAt.lerp(this.campTargetLookAt, campSmoothing);

    const finalPosition = blendedPosition.lerp(this.campCurrentPosition, this.campBlend);
    const finalLookAt = blendedLookAt.lerp(this.campCurrentLookAt, this.campBlend);

    if (this.campBlend > 0.01) {
      this.campElapsed += delta;
      const amplitude = CAMP_CAMERA.CAMERA_DRIFT_AMPLITUDE * this.campBlend;
      const speed = CAMP_CAMERA.CAMERA_DRIFT_SPEED;
      finalPosition.x += Math.sin(this.campElapsed * speed) * amplitude;
      finalPosition.y += Math.sin(this.campElapsed * speed * 0.6 + 1.3) * amplitude * 0.6;
    }

    this.updateShake(delta);

    this.camera.position.copy(finalPosition).add(this.shakeOffset);
    this.camera.lookAt(finalLookAt);
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
