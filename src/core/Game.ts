import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { CameraManager } from './CameraManager';
import { RendererManager } from './RendererManager';
import { InputManager } from './InputManager';
import { GridFloor } from '../world/GridFloor';
import { Lighting } from '../world/Lighting';
import { Player } from '../entities/Player';
import { BulletManager } from '../managers/BulletManager';
import { EnemyManager } from '../managers/EnemyManager';
import { CollisionSystem } from '../managers/CollisionSystem';
import { HealthManager } from '../managers/HealthManager';
import { HpBar } from '../ui/HpBar';
import { GameOverScreen } from '../ui/GameOverScreen';
import { ARENA, PLAYER } from '../utils/constants';

/**
 * Главный класс-оркестратор.
 * Собирает сцену/камеру/рендерер, все игровые системы (движение,
 * пули, враги, коллизии, HP) и UI-оверлеи, запускает game loop.
 * Каждая система — отдельный модуль, подключаемый здесь.
 */
export class Game {
  private sceneManager: SceneManager;
  private cameraManager: CameraManager;
  private rendererManager: RendererManager;
  private inputManager: InputManager;
  private player: Player;
  private bulletManager: BulletManager;
  private enemyManager: EnemyManager;
  private collisionSystem: CollisionSystem;
  private healthManager: HealthManager;
  private hpBar: HpBar;
  private gameOverScreen: GameOverScreen;
  private clock: THREE.Clock;
  private isGameOver = false;

  constructor(canvas: HTMLCanvasElement) {
    const container = canvas.parentElement;
    if (!container) {
      throw new Error('Canvas must be attached to a container element');
    }

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
    this.enemyManager = new EnemyManager();
    this.collisionSystem = new CollisionSystem(
      this.bulletManager,
      this.enemyManager
    );

    this.healthManager = new HealthManager(PLAYER.MAX_HP);
    this.hpBar = new HpBar(container);
    this.gameOverScreen = new GameOverScreen(container, () => this.restart());
    this.hpBar.update(this.healthManager.current, this.healthManager.max);

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
    this.sceneManager.add(this.enemyManager.mesh);
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

    this.healthManager.update(delta);

    if (!this.isGameOver) {
      this.updateGameplay(delta);
    }

    this.rendererManager.render(
      this.sceneManager.scene,
      this.cameraManager.camera
    );
  };

  private updateGameplay(delta: number): void {
    this.inputManager.update(delta);
    this.player.update(
      delta,
      this.inputManager.targetX,
      this.cameraManager.camera
    );
    this.bulletManager.update(delta, this.player.mesh.position);
    this.enemyManager.update(
      delta,
      this.player.mesh.position,
      this.cameraManager.camera
    );

    this.collisionSystem.update(this.player.mesh.position, {
      onEnemyKilled: (x, y, z) => {
        // TODO(шаг 6): заспавнить кристалл опыта в этой точке
        void x;
        void y;
        void z;
      },
      onPlayerHit: () => this.handlePlayerHit(),
    });
  }

  private handlePlayerHit(): void {
    const damageApplied = this.healthManager.takeDamage(PLAYER.CONTACT_DAMAGE);
    if (!damageApplied) return; // заблокировано окном неуязвимости

    this.hpBar.update(this.healthManager.current, this.healthManager.max);

    if (this.healthManager.dead) {
      this.handleGameOver();
    }
  }

  private handleGameOver(): void {
    this.isGameOver = true;
    this.gameOverScreen.show();
  }

  private restart(): void {
    this.healthManager.reset();
    this.hpBar.update(this.healthManager.current, this.healthManager.max);

    this.bulletManager.reset();
    this.enemyManager.reset();
    this.player.resetPosition();
    this.inputManager.reset();

    this.gameOverScreen.hide();
    this.isGameOver = false;
  }
}
