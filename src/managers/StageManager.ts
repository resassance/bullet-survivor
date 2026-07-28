import { STAGE } from '../utils/constants';

export class StageManager {
  private stage = 1;
  private enemiesSpawnedThisStage = 0;
  private spawnCooldown = 0;
  private stageCleared = false;

  public update(delta: number, aliveEnemyCount: number): number {
    if (this.stageCleared) return 0;

    const totalEnemies = this.totalEnemiesForStage(this.stage);

    if (this.enemiesSpawnedThisStage >= totalEnemies) {
      if (aliveEnemyCount === 0) {
        this.stageCleared = true;
      }
      return 0;
    }

    this.spawnCooldown -= delta;
    if (this.spawnCooldown > 0) return 0;

    this.spawnCooldown = this.spawnIntervalForStage(this.stage);

    const remaining = totalEnemies - this.enemiesSpawnedThisStage;
    const batchSize = Math.min(remaining, this.spawnCountForStage(this.stage));
    this.enemiesSpawnedThisStage += batchSize;
    return batchSize;
  }

  public advanceStage(): void {
    this.stage += 1;
    this.enemiesSpawnedThisStage = 0;
    this.spawnCooldown = 0;
    this.stageCleared = false;
  }

  public get isStageCleared(): boolean {
    return this.stageCleared;
  }

  public get currentStage(): number {
    return this.stage;
  }

  public get spawnedCount(): number {
    return this.enemiesSpawnedThisStage;
  }

  public get totalCount(): number {
    return this.totalEnemiesForStage(this.stage);
  }

  private totalEnemiesForStage(stage: number): number {
    return STAGE.BASE_ENEMY_COUNT + (stage - 1) * STAGE.ENEMY_COUNT_INCREMENT;
  }

  private spawnIntervalForStage(stage: number): number {
    return Math.max(
      STAGE.MIN_SPAWN_INTERVAL,
      STAGE.BASE_SPAWN_INTERVAL - (stage - 1) * STAGE.SPAWN_INTERVAL_DECAY
    );
  }

  private spawnCountForStage(stage: number): number {
    const bonus = Math.floor((stage - 1) / STAGE.SPAWN_COUNT_STAGE_STEP);
    return Math.min(STAGE.MAX_SPAWN_COUNT, STAGE.BASE_SPAWN_COUNT + bonus);
  }

  public reset(): void {
    this.stage = 1;
    this.enemiesSpawnedThisStage = 0;
    this.spawnCooldown = 0;
    this.stageCleared = false;
  }
}
