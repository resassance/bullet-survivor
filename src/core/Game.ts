import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { CameraManager } from './CameraManager';
import { RendererManager } from './RendererManager';
import { InputManager } from './InputManager';
import { PostProcessing } from './PostProcessing';
import { GridFloor } from '../world/GridFloor';
import { Lighting } from '../world/Lighting';
import { Player } from '../entities/Player';
import { CoverProp } from '../entities/CoverProp';
import { BulletManager } from '../managers/BulletManager';
import { EnemyManager } from '../managers/EnemyManager';
import { SupplyCrateManager } from '../managers/SupplyCrateManager';
import { GemManager } from '../managers/GemManager';
import { ParticleManager } from '../managers/ParticleManager';
import { CollisionSystem } from '../managers/CollisionSystem';
import { HealthManager } from '../managers/HealthManager';
import { LevelSystem } from '../managers/LevelSystem';
import { HpBar } from '../ui/HpBar';
import { ExpBar } from '../ui/ExpBar';
import { AmmoIndicator } from '../ui/AmmoIndicator';
import { GameOverScreen } from '../ui/GameOverScreen';
import { LevelUpOverlay } from '../ui/LevelUpOverlay';
import { HitFlash } from '../ui/HitFlash';
import { CRATE_MODIFIERS } from '../gameplay/crateModifiers';
import { pickRandomSkills } from '../gameplay/skills';
import { ARENA, PLAYER, CAMERA_SHAKE } from '../utils/constants';

export class Game {
  private sceneManager: SceneManager;
  private cameraManager: CameraManager;
  private rendererManager: RendererManager;
  private postProcessing: PostProcessing;
  private inputManager: InputManager;
  private player: Player;
  private coverProp: CoverProp;
  private bulletManager: BulletManager;
  private enemyManager: EnemyManager;
  private crateManager: SupplyCrateManager;
  private gemManager: GemManager;
  private particleManager: ParticleManager;
  private collisionSystem: CollisionSystem;
  private healthManager: HealthManager;
  private levelSystem: LevelSystem;
  private hpBar: HpBar;
  private expBar: ExpBar;
  private ammoIndicator: AmmoIndicator;
  private gameOverScreen: GameOverScreen;
  private levelUpOverlay: LevelUpOverlay;
  private hitFlash: HitFlash;
  private clock: THREE.Clock;
  private isGameOver = false;
  private isPaused = false;

  constructor(canvas: HTMLCanvasElement) {
    const container = canvas.parentElement;
    if (!container) {
      throw new Error('Canvas must be attached to a container element');
    }

    this.sceneManager = new SceneManager();
    this.rendererManager = new RendererManager(canvas);
    this.cameraManager = new CameraManager(this.rendererManager.aspect);
    this.postProcessing = new PostProcessing(
      this.rendererManager.renderer,
      this.sceneManager.scene,
      this.cameraManager.camera
    );
    this.inputManager = new InputManager(
      canvas,
      this.cameraManager.camera,
      ARENA.PLAYER_BOUND_X
    );
    this.clock = new THREE.Clock();

    this.player = new Player();
    this.coverProp = new CoverProp();
    this.bulletManager = new BulletManager();
    this.enemyManager = new EnemyManager();
    this.crateManager = new SupplyCrateManager();
    this.gemManager = new GemManager();
    this.particleManager = new ParticleManager();
    this.collisionSystem = new CollisionSystem(
      this.bulletManager,
      this.enemyManager
    );

    this.healthManager = new HealthManager(PLAYER.MAX_HP);
    this.levelSystem = new LevelSystem();

    this.hpBar = new HpBar(container);
    this.expBar = new ExpBar(container);
    this.ammoIndicator = new AmmoIndicator(container);
    this.gameOverScreen = new GameOverScreen(container, () => this.restart());
    this.levelUpOverlay = new LevelUpOverlay(container, (skillId) =>
      this.handleSkillPicked(skillId)
    );
    this.hitFlash = new HitFlash(container);

    this.hpBar.update(this.healthManager.current, this.healthManager.max);
    this.expBar.update(0, this.levelSystem.expToNextLevel, this.levelSystem.currentLevel);
    this.ammoIndicator.update(this.bulletManager.ammo, this.bulletManager.magazineCapacity, false);

    this.setupWorld();
    this.bindEvents();
  }

  private setupWorld(): void {
    const grid = new GridFloor();
    this.sceneManager.add(grid.group);

    const lighting = new Lighting();
    this.sceneManager.add(lighting.group);

    this.sceneManager.add(this.player.mesh);
    this.sceneManager.add(this.coverProp.group);
    this.sceneManager.add(this.bulletManager.mesh);
    this.sceneManager.add(this.enemyManager.mesh);
    this.sceneManager.add(this.crateManager.group);
    this.sceneManager.add(this.gemManager.mesh);
    this.sceneManager.add(this.particleManager.mesh);
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.onResize());
  }

  private onResize(): void {
    this.rendererManager.resize();
    this.cameraManager.updateAspect(this.rendererManager.aspect);
    this.postProcessing.resize(window.innerWidth, window.innerHeight);
  }

  public start(): void {
    this.loop();
  }

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.healthManager.update(delta);
    this.cameraManager.update(delta, this.player.position.x, this.bulletManager.isReloading);

    if (!this.isGameOver && !this.isPaused) {
      this.updateGameplay(delta);
    }

    this.postProcessing.render(delta);
  };

  private updateGameplay(delta: number): void {
    this.inputManager.update(delta);
    this.player.update(
      delta,
      this.inputManager.targetX,
      this.cameraManager.camera,
      this.bulletManager.isReloading
    );
    this.coverProp.update(this.player.position.x);

    this.bulletManager.update(delta, this.player.position, () => this.player.triggerRecoil());
    this.ammoIndicator.update(
      this.bulletManager.ammo,
      this.bulletManager.magazineCapacity,
      this.bulletManager.isReloading
    );

    this.enemyManager.update(
      delta,
      this.cameraManager.camera,
      (x, y, z) => this.killEnemy(x, y, z),
      () => this.handlePlayerHit()
    );
    this.crateManager.update(
      delta,
      this.player.position,
      this.bulletManager.slots,
      (modifierIndex) => this.applyCrateModifier(modifierIndex)
    );

    this.collisionSystem.update({
      onEnemyKilled: (x, y, z) => this.killEnemy(x, y, z),
    });

    this.gemManager.update(delta, this.player.position, (value) =>
      this.handleGemCollected(value)
    );
    this.particleManager.update(delta);
  }

  private killEnemy(x: number, y: number, z: number): void {
    this.gemManager.spawn(x, z);
    this.particleManager.burst(x, y, z);
  }

  private handleGemCollected(value: number): void {
    this.levelSystem.addExp(value);
    this.expBar.update(
      this.levelSystem.currentExp,
      this.levelSystem.expToNextLevel,
      this.levelSystem.currentLevel
    );

    if (this.levelSystem.consumePendingLevelUp()) {
      this.triggerLevelUp();
    }
  }

  private triggerLevelUp(): void {
    this.isPaused = true;
    this.levelUpOverlay.show(pickRandomSkills(3));
  }

  private handleSkillPicked(skillId: string): void {
    this.applySkill(skillId);
    this.levelUpOverlay.hide();

    if (this.levelSystem.consumePendingLevelUp()) {
      this.triggerLevelUp();
      return;
    }

    this.isPaused = false;
  }

  private applySkill(skillId: string): void {
    switch (skillId) {
      case 'ricochet':
        this.bulletManager.increasePierce(1);
        break;
      case 'poisonBullets':
        this.bulletManager.addPoisonStacks(1);
        break;
    }
  }

  private applyCrateModifier(modifierIndex: number): void {
    const modifier = CRATE_MODIFIERS[modifierIndex];

    switch (modifier.id) {
      case 'multishot':
        this.bulletManager.addBulletsPerShot(1);
        break;
      case 'fireRate':
        this.bulletManager.increaseFireRate(1.35);
        break;
      case 'damage':
        this.bulletManager.increaseDamage(1);
        break;
      case 'bulletSpeed':
        this.bulletManager.increaseBulletSpeed(1.2);
        break;
    }
  }

  private handlePlayerHit(): void {
    const damageApplied = this.healthManager.takeDamage(PLAYER.CONTACT_DAMAGE);
    if (!damageApplied) return;

    this.hpBar.update(this.healthManager.current, this.healthManager.max);
    this.hitFlash.trigger();
    this.cameraManager.triggerShake(CAMERA_SHAKE.HIT_MAGNITUDE, CAMERA_SHAKE.HIT_DURATION);

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
    this.levelSystem.reset();

    this.hpBar.update(this.healthManager.current, this.healthManager.max);
    this.expBar.update(0, this.levelSystem.expToNextLevel, this.levelSystem.currentLevel);

    this.bulletManager.reset();
    this.ammoIndicator.update(this.bulletManager.ammo, this.bulletManager.magazineCapacity, false);

    this.enemyManager.reset();
    this.crateManager.reset();
    this.gemManager.reset();
    this.particleManager.reset();
    this.player.resetPosition();
    this.inputManager.reset();

    this.levelUpOverlay.hide();
    this.gameOverScreen.hide();
    this.isGameOver = false;
    this.isPaused = false;
  }
}
