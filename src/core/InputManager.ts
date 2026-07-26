import * as THREE from 'three';
import { INPUT } from '../utils/constants';

export class InputManager {
  private canvas: HTMLCanvasElement;
  private camera: THREE.PerspectiveCamera;
  private bound: number;

  private desiredX = 0;

  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private movementPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private intersection = new THREE.Vector3();

  private keyLeft = false;
  private keyRight = false;

  constructor(
    canvas: HTMLCanvasElement,
    camera: THREE.PerspectiveCamera,
    bound: number
  ) {
    this.canvas = canvas;
    this.camera = camera;
    this.bound = bound;

    this.bindPointerEvents();
    this.bindKeyboardEvents();
  }

  private bindPointerEvents(): void {
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerdown', this.onPointerMove);
  }

  private bindKeyboardEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onPointerMove = (event: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();

    this.ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.ndc, this.camera);

    const hit = this.raycaster.ray.intersectPlane(
      this.movementPlane,
      this.intersection
    );

    if (hit) {
      this.desiredX = THREE.MathUtils.clamp(
        this.intersection.x,
        -this.bound,
        this.bound
      );
    }
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'KeyA' || event.code === 'ArrowLeft') {
      this.keyLeft = true;
    }
    if (event.code === 'KeyD' || event.code === 'ArrowRight') {
      this.keyRight = true;
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'KeyA' || event.code === 'ArrowLeft') {
      this.keyLeft = false;
    }
    if (event.code === 'KeyD' || event.code === 'ArrowRight') {
      this.keyRight = false;
    }
  };

  public update(delta: number): void {
    if (this.keyLeft === this.keyRight) return;

    const direction = this.keyLeft ? -1 : 1;
    this.desiredX += direction * INPUT.KEYBOARD_SPEED * delta;
    this.desiredX = THREE.MathUtils.clamp(
      this.desiredX,
      -this.bound,
      this.bound
    );
  }

  public get targetX(): number {
    return this.desiredX;
  }

  public reset(): void {
    this.desiredX = 0;
  }

  public dispose(): void {
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerMove);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
