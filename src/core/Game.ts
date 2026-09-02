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
import { HitFlash } from '../ui/HitFlash';
import { SubtitleBar } from '../ui/SubtitleBar';
import { DialogueScreen } from '../ui/DialogueScreen';
import { VisualNovelScene } from '../ui/VisualNovelScene';
import { FadeOverlay } from '../ui/FadeOverlay';
import { DebugPanel } from '../ui/DebugPanel';
import { CampScreen } from '../ui/CampScreen';
import { ArchiveScreen } from '../ui/ArchiveScreen';
import { PauseButton } from '../ui/PauseButton';
import { CampHotspotOverlay } from '../ui/CampHotspotOverlay';
import { CampWorld } from '../world/CampWorld';
import { AudioManager } from '../managers/AudioManager';
import { CRATE_MODIFIERS } from '../gameplay/crateModifiers';
import { pickRandomSkills } from '../gameplay/skills';
import { WEAPONS } from '../gameplay/weapons';
import { type CampStationId, findCampStation } from '../gameplay/campStations';
import { isSpecialStationUnlocked, isWeaponUnlocked } from '../gameplay/progression';
import {
  pickRandomSubtitle,
  pickIntroDialogue,
  pickVictoryDialogue,
} from '../gameplay/dialogueLines';
import { pickNovelScene } from '../gameplay/novelScenes';
import { CreditsScreen } from '../ui/CreditsScreen';
import {
  ARENA,
  PLAYER,
  CAMERA_SHAKE,
  SUBTITLE,
  CAMP_CAMERA,
  CAMP_SCENE,
  BACKGROUND_COLOR,
  FOG,
  STORY_PROGRESSION,
  SKILL_TUNING,
} from '../utils/constants';

type GameMode = 'story' | 'endless';

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
  private endlessStageManager: StageManager;
  private hpBar: HpBar;
  private expBar: ExpBar;
  private ammoIndicator: AmmoIndicator;
  private stageIndicator: StageIndicator;
  private weaponIndicator: WeaponIndicator;
  private gameOverScreen: GameOverScreen;
  private levelUpOverlay: LevelUpOverlay;
  private hitFlash: HitFlash;
  private subtitleBar: SubtitleBar;
  private dialogueScreen: DialogueScreen;
  private novelScene: VisualNovelScene;
  private fadeOverlay: FadeOverlay;
  private creditsScreen: CreditsScreen;
  private campScreen: CampScreen;
  private archiveScreen: ArchiveScreen;
  private campWorld: CampWorld;
  private battleWorld!: THREE.Group;
  private campHotspotOverlay: CampHotspotOverlay;
  private audioManager: AudioManager;
  private campReturnConfig: { gateId: CampStationId; label: string; onPrimary: () => void } | null =
    null;
  private pauseButton: PauseButton;
  private clock: THREE.Clock;
  private container: HTMLElement;
  private isGameOver = false;
  private isPaused = false;
  private isCampOpen = false;
  private subtitleTimer: number;
  private mode: GameMode = 'story';
  private storyCompleted = false;
  private storyDamageBonus = 0;
  private storyFireRateMultiplier = 1;
  private explosiveChance = 0;
  private endlessBestWave = 0;

  constructor(canvas: HTMLCanvasElement) {
    const container = canvas.parentElement;
    if (!container) {
      throw new Error('Canvas must be attached to a container element');
    }
    this.container = container;

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
    this.endlessStageManager = new StageManager();

    this.hpBar = new HpBar(container);
    this.expBar = new ExpBar(container);
    this.ammoIndicator = new AmmoIndicator(container);
    this.stageIndicator = new StageIndicator(container);
    this.weaponIndicator = new WeaponIndicator(container);
    this.gameOverScreen = new GameOverScreen(container, () => this.restart());
    this.levelUpOverlay = new LevelUpOverlay(container, (skillId) =>
      this.handleSkillPicked(skillId)
    );
    this.hitFlash = new HitFlash(container);
    this.subtitleBar = new SubtitleBar(container);
    this.dialogueScreen = new DialogueScreen(container);
    this.novelScene = new VisualNovelScene(container);
    this.fadeOverlay = new FadeOverlay(container);
    this.creditsScreen = new CreditsScreen(container, () => this.returnToCampAfterStory());

    this.audioManager = new AudioManager();
    const unlockAudioOnce = () => {
      this.audioManager.unlock();
      container.removeEventListener('pointerdown', unlockAudioOnce);
    };
    container.addEventListener('pointerdown', unlockAudioOnce);

    this.campWorld = new CampWorld();
    this.campHotspotOverlay = new CampHotspotOverlay(container, {
      onSelect: (stationId) => this.handleStationSelected(stationId),
      onHover: (stationId) => {
        this.campWorld.setHovered(stationId);
        if (stationId) {
          this.audioManager.playHover();
        }
      },
    });
    this.campScreen = new CampScreen(container, {
      onWeaponSelected: (weaponId) => this.bulletManager.switchWeapon(weaponId),
      onSpecialSelected: (specialId) => this.specialWeaponManager.equip(specialId),
      onArchiveOpen: () => this.openArchive(),
      onPanelClosed: () => this.returnToCampOverview(),
      isAudioMuted: () => this.audioManager.isMuted(),
      onToggleAudioMuted: () => {
        this.audioManager.setMuted(!this.audioManager.isMuted());
        return this.audioManager.isMuted();
      },
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
    this.expBar.setVisible(false);
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
    this.returnToCampHub();
  }

  private setupWorld(): void {
    this.battleWorld = new THREE.Group();

    const grid = new GridFloor();
    this.battleWorld.add(grid.group);

    const lighting = new Lighting();
    this.battleWorld.add(lighting.group);

    this.battleWorld.add(this.player.mesh);
    this.battleWorld.add(this.coverProp.group);
    this.battleWorld.add(this.bulletManager.mesh);
    this.battleWorld.add(this.enemyManager.mesh);
    this.battleWorld.add(this.crateManager.group);
    this.battleWorld.add(this.gemManager.mesh);
    this.battleWorld.add(this.particleManager.mesh);
    this.battleWorld.add(this.specialWeaponManager.group);

    this.sceneManager.add(this.battleWorld);
    this.sceneManager.add(this.campWorld.group);
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
    this.pauseButton.setVisible(!this.isGameOver && !this.isPaused && !this.isCampOpen);

    if (!this.isGameOver && !this.isPaused) {
      this.updateGameplay(delta);
    }

    this.campWorld.update(delta, this.cameraManager.camera);
    this.campHotspotOverlay.update(this.cameraManager.camera, this.container);

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

    const spawnCount = this.activeStageManager.update(delta, this.enemyManager.aliveCount);
    if (spawnCount > 0) {
      this.enemyManager.spawnBatch(spawnCount);
    }
    this.stageIndicator.update(
      this.activeStageManager.currentStage,
      this.activeStageManager.spawnedCount,
      this.activeStageManager.totalCount,
      this.mode === 'endless' ? 'ВОЛНА' : 'УРОВЕНЬ'
    );
    if (this.activeStageManager.isStageCleared) {
      this.handleStageCleared();
    }

    if (this.mode === 'endless') {
      this.crateManager.update(
        delta,
        this.player.position,
        this.bulletManager.slots,
        (modifierIndex) => this.applyCrateModifier(modifierIndex)
      );
    }

    this.collisionSystem.update({
      onEnemyKilled: (x, y, z) => this.killEnemy(x, y, z),
    });

    if (this.mode === 'endless') {
      this.gemManager.update(delta, this.player.position, (value) =>
        this.handleGemCollected(value)
      );
    }
    this.particleManager.update(delta);

    this.updateSubtitleTimer(delta);
  }

  private get activeStageManager(): StageManager {
    return this.mode === 'endless' ? this.endlessStageManager : this.stageManager;
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

  private killEnemy(x: number, y: number, z: number, fromExplosion = false): void {
    if (this.mode === 'endless') {
      this.gemManager.spawn(x, z);
    }
    this.particleManager.burst(x, y, z);

    if (
      !fromExplosion &&
      this.mode === 'endless' &&
      this.explosiveChance > 0 &&
      Math.random() < this.explosiveChance
    ) {
      this.enemyManager.damageInRadius(x, z, SKILL_TUNING.EXPLOSION_RADIUS, (ex, ey, ez) =>
        this.killEnemy(ex, ey, ez, true)
      );
    }
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
      case 'vitality':
        this.healthManager.increaseMaxHp(SKILL_TUNING.VITALITY_MAX_HP_BONUS);
        this.hpBar.update(this.healthManager.current, this.healthManager.max);
        break;
      case 'regen':
        this.healthManager.addRegen(SKILL_TUNING.REGEN_PER_STACK);
        break;
      case 'magazine':
        this.bulletManager.increaseMagazineSize(SKILL_TUNING.MAGAZINE_BONUS);
        this.ammoIndicator.update(
          this.bulletManager.ammo,
          this.bulletManager.magazineCapacity,
          this.bulletManager.isReloading
        );
        break;
      case 'fastReload':
        this.bulletManager.increaseReloadSpeed(SKILL_TUNING.RELOAD_SPEED_MULTIPLIER);
        break;
      case 'explosiveRounds':
        this.explosiveChance = Math.min(
          this.explosiveChance + SKILL_TUNING.EXPLOSION_CHANCE_PER_STACK,
          SKILL_TUNING.EXPLOSION_CHANCE_MAX
        );
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

    if (this.mode === 'endless') {
      const wave = this.endlessStageManager.currentStage;
      const isRecord = wave > this.endlessBestWave;
      this.endlessBestWave = Math.max(this.endlessBestWave, wave);
      this.gameOverScreen.show({
        title: 'забег окончен',
        subtitle: isRecord
          ? `Волна ${wave} · новый рекорд!`
          : `Волна ${wave} · рекорд ${this.endlessBestWave}`,
        buttonLabel: 'в лагерь',
        onAction: () => this.endEndlessRun(),
      });
      return;
    }

    this.gameOverScreen.show();
  }

  private handleStageCleared(): void {
    if (this.mode === 'endless') {
      
      this.endlessStageManager.advanceStage();
      return;
    }

    this.isPaused = true;
    const isFinalStage = this.stageManager.currentStage >= STORY_PROGRESSION.TOTAL_STAGES;
    
    
    this.fadeOverlay.transition(() => {
      const dialogue = pickVictoryDialogue(this.stageManager.currentStage);
      this.dialogueScreen.play(dialogue, () => this.playPostStageNovelScene(isFinalStage));
    });
  }

  private playPostStageNovelScene(isFinalStage: boolean): void {
    const scene = pickNovelScene(this.stageManager.currentStage);
    this.novelScene.play(scene, () => {
      this.applyStoryStageBuff();

      if (isFinalStage) {
        this.finishStory();
        return;
      }

      this.stageManager.advanceStage();
      this.fadeOverlay.transition(() => {
        const dialogue = pickIntroDialogue(this.stageManager.currentStage);
        this.dialogueScreen.play(dialogue, () => {
          this.isPaused = false;
        });
      });
    });
  }

  /** Тихий бафф за пройденный этап сюжета — небольшой прирост урона и скорострельности, без UI. */
  private applyStoryStageBuff(): void {
    this.storyDamageBonus += STORY_PROGRESSION.DAMAGE_PER_STAGE;
    this.storyFireRateMultiplier *= STORY_PROGRESSION.FIRE_RATE_MULT_PER_STAGE;
    this.bulletManager.increaseDamage(STORY_PROGRESSION.DAMAGE_PER_STAGE);
    this.bulletManager.increaseFireRate(STORY_PROGRESSION.FIRE_RATE_MULT_PER_STAGE);
  }

  private finishStory(): void {
    this.storyCompleted = true;
    this.fadeOverlay.transition(() => {
      this.creditsScreen.show();
    });
  }

  private returnToCampAfterStory(): void {
    this.creditsScreen.hide();
    this.returnToCampHub();
  }

  /** Открывает лагерь как хаб: старт новой игры, рестарт, возврат после титров/забега бесконечки. */
  private returnToCampHub(): void {
    this.mode = 'story';
    if (this.storyCompleted) {
      this.showCamp('endless', 'бесконечный режим', () => this.launchEndlessRun());
    } else {
      this.showCamp('story', 'сюжетка', () => this.launchStageFromCamp());
    }
  }

  private launchStageFromCamp(): void {
    this.campScreen.hide();
    this.exitCampWorld();
    this.mode = 'story';
    const dialogue = pickIntroDialogue(this.stageManager.currentStage);
    this.dialogueScreen.play(dialogue, () => {
      this.isPaused = false;
    });
  }

  private launchEndlessRun(): void {
    this.campScreen.hide();
    this.exitCampWorld();
    this.mode = 'endless';

    this.endlessStageManager.reset();
    this.healthManager.reset();
    this.bulletManager.resetRunBonuses();
    this.levelSystem.reset();
    this.enemyManager.reset();
    this.crateManager.reset();
    this.gemManager.reset();
    this.particleManager.reset();
    this.explosiveChance = 0;

    this.hpBar.update(this.healthManager.current, this.healthManager.max);
    this.expBar.setVisible(true);
    this.expBar.update(0, this.levelSystem.expToNextLevel, this.levelSystem.currentLevel);
    this.ammoIndicator.update(this.bulletManager.ammo, this.bulletManager.magazineCapacity, false);
    this.stageIndicator.update(
      this.endlessStageManager.currentStage,
      this.endlessStageManager.spawnedCount,
      this.endlessStageManager.totalCount,
      'ВОЛНА'
    );

    this.isPaused = false;
  }

  private endEndlessRun(): void {
    this.gameOverScreen.hide();
    this.isGameOver = false;
    this.mode = 'story';

    this.expBar.setVisible(false);
    this.enemyManager.reset();
    this.crateManager.reset();
    this.gemManager.reset();
    this.particleManager.reset();
    this.levelUpOverlay.hide();
    this.player.resetPosition();

    this.healthManager.reset();
    
    this.bulletManager.resetRunBonuses();
    this.bulletManager.increaseDamage(this.storyDamageBonus);
    this.bulletManager.increaseFireRate(this.storyFireRateMultiplier);

    this.hpBar.update(this.healthManager.current, this.healthManager.max);
    this.ammoIndicator.update(this.bulletManager.ammo, this.bulletManager.magazineCapacity, false);
    this.stageIndicator.update(
      this.stageManager.currentStage,
      this.stageManager.spawnedCount,
      this.stageManager.totalCount
    );

    this.isPaused = true;
    this.returnToCampHub();
  }

  private openCampMidStage(): void {
    this.isPaused = true;
    const gateId: CampStationId = this.mode === 'endless' ? 'endless' : 'story';
    this.showCamp(gateId, 'продолжить бой', () => this.closeCampMidStage());
  }

  private closeCampMidStage(): void {
    this.campScreen.hide();
    this.exitCampWorld();
    this.isPaused = false;
  }

  private showCamp(gateId: CampStationId, gateLabel: string, onPrimary: () => void): void {
    this.campReturnConfig = { gateId, label: gateLabel, onPrimary };
    this.enterCampWorld();

    this.campWorld.resetGateLabel('story');
    this.campWorld.resetGateLabel('endless');
    this.campWorld.setGateLabel(gateId, gateLabel.toUpperCase());

    this.campScreen.show(
      this.bulletManager.weaponId,
      this.specialWeaponManager.equippedId,
      this.stageManager.currentStage,
      this.storyCompleted
    );
  }

  private enterCampWorld(): void {
    this.isCampOpen = true;
    this.battleWorld.visible = false;
    this.campWorld.group.visible = true;
    const stage = this.stageManager.currentStage;
    this.campWorld.setStationLocked('special', !isSpecialStationUnlocked(stage));
    this.campWorld.setStationLocked('endless', !this.storyCompleted);
    this.campWorld.setStationLocked('story', this.storyCompleted);
    this.campWorld.setWeaponUnlocks(WEAPONS.map((weapon) => isWeaponUnlocked(weapon.id, stage)));
    this.campWorld.setStoryProgress(stage);
    this.cameraManager.setCampActive(true);
    this.cameraManager.setCampTarget(CAMP_CAMERA.OVERVIEW_POSITION, CAMP_CAMERA.OVERVIEW_LOOK_AT);
    this.campHotspotOverlay.setVisible(true);
    this.campWorld.setActiveStation(null);
    this.sceneManager.scene.background = new THREE.Color(CAMP_SCENE.BACKGROUND_COLOR);
    this.sceneManager.scene.fog = new THREE.FogExp2(CAMP_SCENE.FOG_COLOR, CAMP_SCENE.FOG_DENSITY);
    this.audioManager.startCampAmbience();
  }

  private exitCampWorld(): void {
    this.isCampOpen = false;
    this.battleWorld.visible = true;
    this.campWorld.group.visible = false;
    this.cameraManager.setCampActive(false);
    this.campHotspotOverlay.setVisible(false);
    this.campWorld.setActiveStation(null);
    this.campWorld.setHovered(null);
    this.sceneManager.scene.background = new THREE.Color(BACKGROUND_COLOR);
    this.sceneManager.scene.fog = new THREE.FogExp2(FOG.COLOR, FOG.DENSITY);
    this.audioManager.stopCampAmbience();
  }

  private returnToCampOverview(): void {
    if (!this.isCampOpen) return;
    this.cameraManager.setCampTarget(CAMP_CAMERA.OVERVIEW_POSITION, CAMP_CAMERA.OVERVIEW_LOOK_AT);
    this.campWorld.setActiveStation(null);
  }

  private handleStationSelected(id: CampStationId): void {
    const station = findCampStation(id);
    this.cameraManager.setCampTarget(station.cameraPosition, station.cameraLookAt);
    this.campWorld.setActiveStation(id);

    if (id === 'story' || id === 'endless') {
      if (this.campWorld.isStationLocked(id)) {
        this.audioManager.playSelect();
        this.campScreen.openStation(id);
        return;
      }

      this.audioManager.playWhoosh();
      
      
      if (this.campReturnConfig?.gateId === id) {
        
        const onPrimary = this.campReturnConfig.onPrimary;
        window.setTimeout(() => onPrimary(), 500);
        return;
      }

      window.setTimeout(() => {
        if (id === 'story') this.launchStageFromCamp();
        else this.launchEndlessRun();
      }, 500);
      return;
    }

    this.audioManager.playSelect();
    this.campScreen.openStation(id);
  }

  private openArchive(): void {
    this.campScreen.hide();
    this.archiveScreen.show();
  }

  private closeArchive(): void {
    this.archiveScreen.hide();
    this.returnToCampOverview();
    if (this.campReturnConfig) {
      this.campScreen.show(
        this.bulletManager.weaponId,
        this.specialWeaponManager.equippedId,
        this.stageManager.currentStage,
        this.storyCompleted
      );
    }
  }

  private debugSkipStage(): void {
    this.enemyManager.clearAllAlive();
    this.activeStageManager.forceClear();
  }

  private restart(): void {
    this.mode = 'story';
    this.storyCompleted = false;
    this.storyDamageBonus = 0;
    this.storyFireRateMultiplier = 1;
    this.explosiveChance = 0;
    this.endlessBestWave = 0;

    this.healthManager.reset();
    this.levelSystem.reset();
    this.stageManager.reset();
    this.endlessStageManager.reset();

    this.hpBar.update(this.healthManager.current, this.healthManager.max);
    this.expBar.update(0, this.levelSystem.expToNextLevel, this.levelSystem.currentLevel);
    this.expBar.setVisible(false);
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
    this.creditsScreen.hide();
    this.isGameOver = false;

    this.isPaused = true;
    this.returnToCampHub();
  }
}
