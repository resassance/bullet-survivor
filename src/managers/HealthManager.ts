import { PLAYER } from '../utils/constants';

export class HealthManager {
  private readonly baseMaxHp: number;
  private hp: number;
  private isDead = false;
  private invulnerabilityTimer = 0;
  private maxHp: number;
  private regenPerSecond = 0;

  constructor(maxHp: number = PLAYER.MAX_HP) {
    this.baseMaxHp = maxHp;
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  public update(delta: number): void {
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= delta;
    }

    if (!this.isDead && this.regenPerSecond > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.regenPerSecond * delta);
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isDead || this.invulnerabilityTimer > 0) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerabilityTimer = PLAYER.INVULNERABILITY_DURATION;

    if (this.hp <= 0) {
      this.isDead = true;
    }
    return true;
  }

  /** Тихий бафф-карточка "Живучесть": расширяет максимум HP и лечит на ту же величину. */
  public increaseMaxHp(amount: number): void {
    this.maxHp += amount;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /** Тихий бафф-карточка "Регенерация": добавляет пассивное авто-восстановление HP/сек. */
  public addRegen(amountPerSecond: number): void {
    this.regenPerSecond += amountPerSecond;
  }

  public reset(): void {
    this.maxHp = this.baseMaxHp;
    this.regenPerSecond = 0;
    this.hp = this.maxHp;
    this.isDead = false;
    this.invulnerabilityTimer = 0;
  }

  public get current(): number {
    return this.hp;
  }

  public get max(): number {
    return this.maxHp;
  }

  public get dead(): boolean {
    return this.isDead;
  }

  public get isInvulnerable(): boolean {
    return this.invulnerabilityTimer > 0;
  }
}
