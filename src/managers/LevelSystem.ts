import { LEVEL } from '../utils/constants';

export class LevelSystem {
  private exp = 0;
  private level = 1;
  private expToNext = LEVEL.BASE_EXP;
  private pendingLevelUps = 0;

  public addExp(amount: number): void {
    this.exp += amount;

    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level += 1;
      this.expToNext = LEVEL.BASE_EXP + (this.level - 1) * LEVEL.EXP_INCREMENT;
      this.pendingLevelUps += 1;
    }
  }

  public consumePendingLevelUp(): boolean {
    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
      return true;
    }
    return false;
  }

  public reset(): void {
    this.exp = 0;
    this.level = 1;
    this.expToNext = LEVEL.BASE_EXP;
    this.pendingLevelUps = 0;
  }

  public get currentExp(): number {
    return this.exp;
  }

  public get expToNextLevel(): number {
    return this.expToNext;
  }

  public get currentLevel(): number {
    return this.level;
  }
}
