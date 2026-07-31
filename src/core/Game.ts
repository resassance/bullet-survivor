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
import { SpecialWeaponManager } from '../managers/SpecialWeaponManager';
import { CollisionSystem } from '../managers/CollisionSystem';
import { HealthManager } from '../managers/HealthManager';
import { LevelSystem } from '../managers/LevelSystem';
import { StageManager } from '../managers/StageManager';
import { HpBar } from '../ui/HpBar';
import { ExpBar } from '../ui/ExpBar';
import { AmmoIndicator } from '../ui/AmmoIndicator';
import { StageIndicator } from '../ui/StageIndicator';
import { WeaponIndicator } from '../ui/WeaponIndicator';
import { GameOverScreen } from '../ui/GameOverScreen';
import { LevelUpOverlay } from '../ui/LevelUpOverlay';
import { StageCompleteScreen } from '../ui/StageCompleteScreen';
import { HitFlash } from '../ui/HitFlash';
import { SubtitleBar } from '../ui/SubtitleBar';
import { DialogueScreen } from '../ui/DialogueScreen';
import { DebugPanel } from '../ui/DebugPanel';
import { CampScreen } from '../ui/CampScreen';
import { ArchiveScreen } from '../ui/ArchiveScreen';
import { PauseButton } from '../ui/PauseButton';
import { CRATE_MODIFIERS } from '../gameplay/crateModifiers';
import { pickRandomSkills } from '../gameplay/skills';
import {
  pickRandomSubtitle,
  pickIntroDialogue,
  pickVictoryDialogue,
} from '../gameplay/dialogueLines';
import { ARENA, PLAYER, CAMERA_SHAKE, SUBTITLE } from '../utils/constants';

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
  private specialWeaponManager: SpecialWeaponManager;
  private collisionSystem: CollisionSystem;
  private healthManager: HealthManager;
  private levelSystem: LevelSystem;
  private stageManager: StageManager;
  private hpBar: HpBar;
  private expBar: ExpBar;
  private ammoIndicator: AmmoIndicator;
  private stageIndicator: StageIndicator;
  private weaponIndicator: WeaponIndicator;
  private gameOverScreen: GameOverScreen;
  private levelUpOverlay: LevelUpOverlay;
  private stageCompleteScreen: StageCompleteScreen;
  private hitFlash: HitFlash;
  private subtitleBar: SubtitleBar;
  private dialogueScreen: DialogueScreen;
  private campScreen: CampScreen;
  private archiveScreen: ArchiveScreen;
  private campReturnConfig: { label: string; onPrimary: () => void } | null = null;
  private pauseButton: PauseButton;
  private clock: THREE.Clock;
  private isGameOver = false;
  private isPaused = false;
  private subtitleTimer: number;

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
    this.specialWeaponManager = new SpecialWeaponManager();
    this.collisionSystem = new CollisionSystem(
      this.bulletManager,
      this.enemyManager
    );

    this.healthManager = new HealthManager(PLAYER.MAX_HP);
    this.levelSystem = new LevelSystem();
    this.stageManager = new StageManager();

    this.hpBar = new HpBar(container);
    this.expBar = new ExpBar(container);
    this.ammoIndicator = new AmmoIndicator(container);
    this.stageIndicator = new StageIndicator(container);
    this.weaponIndicator = new WeaponIndicator(container);
    this.gameOverScreen = new GameOverScreen(container, () => this.restart());
    this.levelUpOverlay = new LevelUpOverlay(container, (skillId) =>
      this.handleSkillPicked(skillId)
    );
    this.stageCompleteScreen = new StageCompleteScreen(container, () =>
      this.handleStageContinue()
    );
    this.hitFlash = new HitFlash(container);
    this.subtitleBar = new SubtitleBar(container);
    this.dialogueScreen = new DialogueScreen(container);
    this.campScreen = new CampScreen(container, {
      onWeaponSelected: (weaponId) => this.bulletManager.switchWeapon(weaponId),
      onArchiveOpen: () => this.openArchive(),
    });
    this.archiveScreen = new ArchiveScreen(container, () => this.closeArchive());
    this.pauseButton = new PauseButton(container, () => this.openCampMidStage());
    new DebugPanel(container, {
      onWeaponSelected: (weaponId) => this.bulletManager.switchWeapon(weaponId),
      onSpecialSelected: (specialId) => this.specialWeaponManager.equip(specialId),
      onSkipStage: () => this.debugSkipStage(),
    });

    this.hpBar.update(this.healthManager.current, this.healthManager.max);
    this.expBar.update(0, this.levelSystem.expToNextLevel, this.levelSystem.currentLevel);
    this.ammoIndicator.update(this.bulletManager.ammo, this.bulletManager.magazineCapacity, false);
    this.stageIndicator.update(
      this.stageManager.currentStage,
      this.stageManager.spawnedCount,
      this.stageManager.totalCount
    );
    this.subtitleTimer = THREE.MathUtils.randFloat(SUBTITLE.MIN_INTERVAL, SUBTITLE.MAX_INTERVAL);

    this.setupWorld();
    this.bindEvents();

    this.isPaused = true;
    this.showCampForNextStage();
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
    this.sceneManager.add(this.specialWeaponManager.group);
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
    const delta = Math.min(this.clock.getDelta(), 0.25);

    this.healthManager.update(delta);
    this.cameraManager.update(delta, this.player.position.x, this.bulletManager.isReloading);
    this.pauseButton.setVisible(!this.isGameOver && !this.isPaused);

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

    this.bulletManager.update(delta, this.player.position, () => this.player.triggerShot());
    this.ammoIndicator.update(
      this.bulletManager.ammo,
      this.bulletManager.magazineCapacity,
      this.bulletManager.isReloading
    );
    this.weaponIndicator.update(
      this.bulletManager.weaponName,
      this.specialWeaponSummaryName(),
      this.specialWeaponManager.cooldownRatio
    );

    this.enemyManager.update(
      delta,
      this.cameraManager.camera,
      (x, y, z) => this.killEnemy(x, y, z),
      () => this.handlePlayerHit()
    );

    this.specialWeaponManager.update(
      delta,
      this.player.position,
      this.enemyManager,
      (x, y, z) => this.killEnemy(x, y, z),
      (x, y, z) => this.particleManager.burst(x, y, z)
    );

    const spawnCount = this.stageManager.update(delta, this.enemyManager.aliveCount);
    if (spawnCount > 0) {
      this.enemyManager.spawnBatch(spawnCount);
    }
    this.stageIndicator.update(
      this.stageManager.currentStage,
      this.stageManager.spawnedCount,
      this.stageManager.totalCount
    );
    if (this.stageManager.isStageCleared) {
      this.handleStageCleared();
    }

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

    this.updateSubtitleTimer(delta);
  }

  private specialWeaponSummaryName(): string | null {
    const id = this.specialWeaponManager.equippedId;
    if (!id) return null;
    if (id === 'lightning') return 'Молния';
    if (id === 'windSlash') return 'Ветер';
    return 'Бомбы';
  }

  private updateSubtitleTimer(delta: number): void {
    this.subtitleTimer -= delta;
    if (this.subtitleTimer <= 0) {
      this.subtitleTimer = THREE.MathUtils.randFloat(SUBTITLE.MIN_INTERVAL, SUBTITLE.MAX_INTERVAL);
      this.subtitleBar.show(pickRandomSubtitle());
    }
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
      this.bulletManager.increaseMagazineSize(1);
      this.ammoIndicator.update(
        this.bulletManager.ammo,
        this.bulletManager.magazineCapacity,
        this.bulletManager.isReloading
      );
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
      this.bulletManager.increaseMagazineSize(1);
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

  private handleStageCleared(): void {
    this.isPaused = true;
    this.stageCompleteScreen.show(this.stageManager.currentStage);
  }

  private handleStageContinue(): void {
    this.stageCompleteScreen.hide();
    const dialogue = pickVictoryDialogue(this.stageManager.currentStage);
    this.dialogueScreen.play(dialogue, () => {
      this.stageManager.advanceStage();
      this.showCampForNextStage();
    });
  }

  private showCampForNextStage(): void {
    this.showCamp('сюжетка', () => this.launchStageFromCamp());
  }

  private launchStageFromCamp(): void {
    this.campScreen.hide();
    const dialogue = pickIntroDialogue(this.stageManager.currentStage);
    this.dialogueScreen.play(dialogue, () => {
      this.isPaused = false;
    });
  }

  private openCampMidStage(): void {
    this.isPaused = true;
    this.showCamp('продолжить бой', () => this.closeCampMidStage());
  }

  private closeCampMidStage(): void {
    this.campScreen.hide();
    this.isPaused = false;
  }

  private showCamp(primaryLabel: string, onPrimary: () => void): void {
    this.campReturnConfig = { label: primaryLabel, onPrimary };
    this.campScreen.show(primaryLabel, onPrimary, this.bulletManager.weaponId);
  }

  private openArchive(): void {
    this.campScreen.hide();
    this.archiveScreen.show();
  }

  private closeArchive(): void {
    this.archiveScreen.hide();
    if (this.campReturnConfig) {
      this.campScreen.show(
        this.campReturnConfig.label,
        this.campReturnConfig.onPrimary,
        this.bulletManager.weaponId
      );
    }
  }

  private debugSkipStage(): void {
    this.enemyManager.clearAllAlive();
    this.stageManager.forceClear();
  }

  private restart(): void {
    this.healthManager.reset();
    this.levelSystem.reset();
    this.stageManager.reset();

    this.hpBar.update(this.healthManager.current, this.healthManager.max);
    this.expBar.update(0, this.levelSystem.expToNextLevel, this.levelSystem.currentLevel);
    this.stageIndicator.update(
      this.stageManager.currentStage,
      this.stageManager.spawnedCount,
      this.stageManager.totalCount
    );

    this.bulletManager.reset();
    this.ammoIndicator.update(this.bulletManager.ammo, this.bulletManager.magazineCapacity, false);

    this.enemyManager.reset();
    this.crateManager.reset();
    this.gemManager.reset();
    this.particleManager.reset();
    this.specialWeaponManager.reset();
    this.player.resetPosition();
    this.inputManager.reset();

    this.levelUpOverlay.hide();
    this.gameOverScreen.hide();
    this.stageCompleteScreen.hide();
    this.isGameOver = false;

    this.isPaused = true;
    this.showCampForNextStage();
  }
}
