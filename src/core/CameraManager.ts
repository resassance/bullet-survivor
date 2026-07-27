import * as THREE from 'three';
import { CAMERA } from '../utils/constants';

export class CameraManager {
  public readonly camera: THREE.PerspectiveCamera;

  private basePosition: THREE.Vector3;
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();
  private shakeMagnitude = 0;
  private shakeDuration = 0;
  private shakeElapsed = 0;

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

    this.applyPosition();
    this.camera.lookAt(
      CAMERA.LOOK_AT.x,
      CAMERA.LOOK_AT.y,
      CAMERA.LOOK_AT.z
    );
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

  public update(delta: number): void {
    if (this.shakeElapsed >= this.shakeDuration) {
      if (this.shakeOffset.lengthSq() > 0) {
        this.shakeOffset.set(0, 0, 0);
        this.applyPosition();
      }
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
    this.applyPosition();
  }

  private applyPosition(): void {
    this.camera.position.copy(this.basePosition).add(this.shakeOffset);
  }
}
