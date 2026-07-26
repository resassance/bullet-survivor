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
import { GateManager } from '../managers/GateManager';
import { CollisionSystem } from '../managers/CollisionSystem';
import { HealthManager } from '../managers/HealthManager';
import { HpBar } from '../ui/HpBar';
import { GameOverScreen } from '../ui/GameOverScreen';
import { GATE_MODIFIERS } from '../gameplay/modifiers';
import { ARENA, PLAYER } from '../utils/constants';

export class Game {
  private sceneManager: SceneManager;
  private cameraManager: CameraManager;
  private rendererManager: RendererManager;
  private inputManager: InputManager;
  private player: Player;
  private bulletManager: BulletManager;
  private enemyManager: EnemyManager;
  private gateManager: GateManager;
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
    this.gateManager = new GateManager();
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
    this.sceneManager.add(this.gateManager.group);
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
    this.gateManager.update(
      delta,
      this.player.mesh.position,
      this.bulletManager.slots,
      (modifierIndex) => this.applyGateModifier(modifierIndex)
    );

    this.collisionSystem.update(this.player.mesh.position, {
      onEnemyKilled: (x, y, z) => {
        void x;
        void y;
        void z;
      },
      onPlayerHit: () => this.handlePlayerHit(),
    });
  }

  private applyGateModifier(modifierIndex: number): void {
    const modifier = GATE_MODIFIERS[modifierIndex];

    switch (modifier.id) {
      case 'multishot':
        this.bulletManager.addBulletsPerShot(2);
        break;
      case 'fireRate':
        this.bulletManager.increaseFireRate(2);
        break;
      case 'damage':
        this.bulletManager.increaseDamage(1);
        break;
      case 'bulletSpeed':
        this.bulletManager.increaseBulletSpeed(1.5);
        break;
    }
  }

  private handlePlayerHit(): void {
    const damageApplied = this.healthManager.takeDamage(PLAYER.CONTACT_DAMAGE);
    if (!damageApplied) return;

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
    this.gateManager.reset();
    this.player.resetPosition();
    this.inputManager.reset();

    this.gameOverScreen.hide();
    this.isGameOver = false;
  }
}
