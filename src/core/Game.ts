import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { CameraManager } from './CameraManager';
import { RendererManager } from './RendererManager';
import { InputManager } from './InputManager';
import { GridFloor } from '../world/GridFloor';
import { Lighting } from '../world/Lighting';
import { Player } from '../entities/Player';
import { BulletManager } from '../managers/BulletManager';
import { ARENA } from '../utils/constants';

/**
 * Главный класс-оркестратор.
 * На шаге 1 собирает сцену/камеру/рендерер/пол/свет и запускает
 * game loop. В следующих шагах сюда будут добавляться
 * PlayerController, BulletManager, EnemyManager и т.д. —
 * каждый как отдельный модуль, подключаемый здесь.
 */
export class Game {
  private sceneManager: SceneManager;
  private cameraManager: CameraManager;
  private rendererManager: RendererManager;
  private inputManager: InputManager;
  private player: Player;
  private bulletManager: BulletManager;
  private clock: THREE.Clock;

  constructor(canvas: HTMLCanvasElement) {
    this.sceneManager = new SceneManager();
    this.rendererManager = new RendererManager(canvas);
    this.cameraManager = new CameraManager(this.rendererManager.aspect);
    this.inputManager = new InputManager(
      canvas,
      this.cameraManager.camera,
      ARENA.PLAYER_BOUND_X
    );
    this.clock = new THREE.Clock();

    this.player = new Player();
    this.bulletManager = new BulletManager();
    this.setupWorld();
    this.bindEvents();
  }

  private setupWorld(): void {
    const grid = new GridFloor();
    this.sceneManager.add(grid.group);

    const lighting = new Lighting();
    this.sceneManager.add(lighting.group);

    this.sceneManager.add(this.player.mesh);
    this.sceneManager.add(this.bulletManager.mesh);
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.onResize());
  }

  private onResize(): void {
    this.rendererManager.resize();
    this.cameraManager.updateAspect(this.rendererManager.aspect);
  }

  public start(): void {
    this.loop();
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    const delta = this.clock.getDelta();

    this.inputManager.update(delta);
    this.player.update(delta, this.inputManager.targetX, this.cameraManager.camera);
    this.bulletManager.update(delta, this.player.mesh.position);

    this.rendererManager.render(
      this.sceneManager.scene,
      this.cameraManager.camera
    );
  };
}
