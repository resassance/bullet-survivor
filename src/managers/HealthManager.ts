import { PLAYER } from '../utils/constants';

/**
 * HP игрока + окно неуязвимости после удара.
 * Неуязвимость нужна не только "для фана" — без неё несколько
 * врагов, столкнувшихся с игроком в один и тот же кадр, снимут
 * несколько единиц HP разом (CollisionSystem это позволяет,
 * т.к. проверяет всех врагов независимо).
 */
export class HealthManager {
  private hp: number;
  private isDead = false;
  private invulnerabilityTimer = 0;
  private maxHp: number;

  constructor(maxHp: number = PLAYER.MAX_HP) {
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  public update(delta: number): void {
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= delta;
    }
  }

  /** @returns true, если урон реально применился (не был заблокирован неуязвимостью) */
  public takeDamage(amount: number): boolean {
    if (this.isDead || this.invulnerabilityTimer > 0) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerabilityTimer = PLAYER.INVULNERABILITY_DURATION;

    if (this.hp <= 0) {
      this.isDead = true;
    }
    return true;
  }

  public reset(): void {
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
