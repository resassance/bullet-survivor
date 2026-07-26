import * as THREE from 'three';
import { CAMERA } from '../utils/constants';

export class CameraManager {
  public readonly camera: THREE.PerspectiveCamera;

  private basePosition: THREE.Vector3;
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();

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

  public setShakeOffset(offset: THREE.Vector3): void {
    this.shakeOffset.copy(offset);
    this.applyPosition();
  }

  private applyPosition(): void {
    this.camera.position.copy(this.basePosition).add(this.shakeOffset);
  }
}
